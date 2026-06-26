/**
 * C/C++ Web Worker — compiles and runs C/C++ entirely in-browser.
 *
 * Architecture (adapted from binji/wasm-clang shared.js):
 *   1. Load memfs.wasm → in-memory virtual filesystem
 *   2. Untar sysroot.tar → standard headers/libs into memfs
 *   3. Load clang.wasm → compile source → .o object file
 *   4. Load lld.wasm → link .o → executable .wasm
 *   5. Instantiate output .wasm with minimal WASI → capture stdout/stderr
 *
 * All assets are fetched from binji.github.io/wasm-clang (the live demo).
 * Everything runs in this worker thread — zero UI blocking.
 */

const CDN = '';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ESUCCESS = 0;

function readStr(u8: Uint8Array, o: number, len = -1): string {
	let str = '';
	const end = len === -1 ? u8.length : o + len;
	for (let i = o; i < end && u8[i] !== 0; ++i) str += String.fromCharCode(u8[i]);
	return str;
}

// ── Memory wrapper (matches shared.js) ───────────────────────────────────────

class Memory {
	memory: WebAssembly.Memory;
	buffer: ArrayBuffer;
	u8: Uint8Array;
	u32: Uint32Array;

	constructor(memory: WebAssembly.Memory) {
		this.memory = memory;
		this.buffer = memory.buffer;
		this.u8 = new Uint8Array(this.buffer);
		this.u32 = new Uint32Array(this.buffer);
	}

	check() {
		if (this.buffer.byteLength === 0) {
			this.buffer = this.memory.buffer;
			this.u8 = new Uint8Array(this.buffer);
			this.u32 = new Uint32Array(this.buffer);
		}
	}

	read8(o: number) { return this.u8[o]; }
	read32(o: number) { return this.u32[o >> 2]; }
	write8(o: number, v: number) { this.u8[o] = v; }
	write32(o: number, v: number) { this.u32[o >> 2] = v; }
	write64(o: number, vlo: number, vhi = 0) { this.write32(o, vlo); this.write32(o + 4, vhi); }

	readStr(o: number, len?: number): string {
		return readStr(this.u8, o, len ?? -1);
	}

	writeStr(o: number, str: string): number {
		o += this.write(o, str);
		this.write8(o, 0);
		return str.length + 1;
	}

	write(o: number, buf: ArrayBuffer | Uint8Array | string | number[]): number {
		if (buf instanceof ArrayBuffer) {
			return this.write(o, new Uint8Array(buf));
		} else if (typeof buf === 'string') {
			return this.write(o, buf.split('').map(x => x.charCodeAt(0)));
		} else {
			const dst = new Uint8Array(this.buffer, o, buf.length);
			dst.set(buf as Uint8Array);
			return buf.length;
		}
	}
}

// ── ProcExit ─────────────────────────────────────────────────────────────────

class ProcExit extends Error {
	code: number;
	constructor(code: number) {
		super(`process exited with code ${code}.`);
		this.code = code;
	}
}

// ── MemFS (in-memory filesystem WASM wrapper) ────────────────────────────────

class MemFS {
	hostWrite: (s: string) => void;
	stdinStr: string;
	stdinStrPos: number;
	memfsFilename: string;
	hostMem_: Memory | null;
	instance!: WebAssembly.Instance;
	exports!: any;
	mem!: Memory;
	ready: Promise<void>;

	constructor(options: {
		compileStreaming: (f: string) => Promise<WebAssembly.Module>;
		hostWrite: (s: string) => void;
		stdinStr?: string;
		memfsFilename: string;
	}) {
		this.hostWrite = options.hostWrite;
		this.stdinStr = options.stdinStr || '';
		this.stdinStrPos = 0;
		this.memfsFilename = options.memfsFilename;
		this.hostMem_ = null;

		const env = this._getImportObject([
			'abort', 'host_write', 'host_read', 'memfs_log', 'copy_in', 'copy_out'
		]);

		this.ready = options.compileStreaming(this.memfsFilename)
			.then(module => WebAssembly.instantiate(module, { env }))
			.then(instance => {
				this.instance = instance;
				this.exports = instance.exports;
				this.mem = new Memory(this.exports.memory);
				this.exports.init();
			});
	}

	private _getImportObject(names: string[]): Record<string, Function> {
		const result: Record<string, Function> = {};
		for (const name of names) {
			result[name] = (this as any)[name].bind(this);
		}
		return result;
	}

	set hostMem(mem: Memory) { this.hostMem_ = mem; }

	setStdinStr(str: string) {
		this.stdinStr = str;
		this.stdinStrPos = 0;
	}

	addDirectory(path: string) {
		this.mem.check();
		this.mem.write(this.exports.GetPathBuf(), path);
		this.exports.AddDirectoryNode(path.length);
	}

	addFile(path: string, contents: string | Uint8Array | ArrayBuffer) {
		const length = contents instanceof ArrayBuffer
			? contents.byteLength
			: contents.length;
		this.mem.check();
		this.mem.write(this.exports.GetPathBuf(), path);
		const inode = this.exports.AddFileNode(path.length, length);
		const addr = this.exports.GetFileNodeAddress(inode);
		this.mem.check();
		this.mem.write(addr, contents as any);
	}

	getFileContents(path: string): Uint8Array {
		this.mem.check();
		this.mem.write(this.exports.GetPathBuf(), path);
		const inode = this.exports.FindNode(path.length);
		const addr = this.exports.GetFileNodeAddress(inode);
		const size = this.exports.GetFileNodeSize(inode);
		return new Uint8Array(this.mem.buffer, addr, size);
	}

	abort() { throw new Error('abort'); }

	host_write(fd: number, iovs: number, iovs_len: number, nwritten_out: number): number {
		this.hostMem_!.check();
		let size = 0;
		let str = '';
		for (let i = 0; i < iovs_len; ++i) {
			const buf = this.hostMem_!.read32(iovs); iovs += 4;
			const len = this.hostMem_!.read32(iovs); iovs += 4;
			str += this.hostMem_!.readStr(buf, len);
			size += len;
		}
		this.hostMem_!.write32(nwritten_out, size);
		this.hostWrite(str);
		return ESUCCESS;
	}

	host_read(fd: number, iovs: number, iovs_len: number, nread: number): number {
		this.hostMem_!.check();
		let size = 0;
		for (let i = 0; i < iovs_len; ++i) {
			const buf = this.hostMem_!.read32(iovs); iovs += 4;
			const len = this.hostMem_!.read32(iovs); iovs += 4;
			const lenToWrite = Math.min(len, this.stdinStr.length - this.stdinStrPos);
			if (lenToWrite === 0) break;
			this.hostMem_!.write(buf, this.stdinStr.substr(this.stdinStrPos, lenToWrite));
			size += lenToWrite;
			this.stdinStrPos += lenToWrite;
			if (lenToWrite !== len) break;
		}
		this.hostMem_!.write32(nread, size);
		return ESUCCESS;
	}

	memfs_log(buf: number, len: number) {
		this.mem.check();
		console.log(this.mem.readStr(buf, len));
	}

	copy_out(clang_dst: number, memfs_src: number, size: number) {
		this.hostMem_!.check();
		const dst = new Uint8Array(this.hostMem_!.buffer, clang_dst, size);
		this.mem.check();
		const src = new Uint8Array(this.mem.buffer, memfs_src, size);
		dst.set(src);
	}

	copy_in(memfs_dst: number, clang_src: number, size: number) {
		this.mem.check();
		const dst = new Uint8Array(this.mem.buffer, memfs_dst, size);
		this.hostMem_!.check();
		const src = new Uint8Array(this.hostMem_!.buffer, clang_src, size);
		dst.set(src);
	}
}

// ── App (WASI app runner — matches shared.js) ────────────────────────────────

class App {
	argv: string[];
	environ: Record<string, string>;
	memfs: MemFS;
	instance!: WebAssembly.Instance;
	exports!: any;
	mem!: Memory;
	ready: Promise<void>;

	constructor(module: WebAssembly.Module, memfs: MemFS, name: string, ...args: string[]) {
		this.argv = [name, ...args];
		this.environ = { USER: 'alice' };
		this.memfs = memfs;

		const envImports = this._getImportObject([
			'proc_exit', 'environ_sizes_get', 'environ_get',
			'args_sizes_get', 'args_get', 'random_get',
			'clock_time_get', 'poll_oneoff'
		]);

		// Stub canvas functions that clang/lld won't call but the module imports
		const canvasStubs: Record<string, Function> = {};
		const canvasNames = [
			'canvas_arc', 'canvas_arcTo', 'canvas_beginPath', 'canvas_bezierCurveTo',
			'canvas_clearRect', 'canvas_clip', 'canvas_closePath', 'canvas_createImageData',
			'canvas_destroyHandle', 'canvas_ellipse', 'canvas_fill', 'canvas_fillRect',
			'canvas_fillText', 'canvas_imageDataSetData', 'canvas_lineTo', 'canvas_measureText',
			'canvas_moveTo', 'canvas_putImageData', 'canvas_quadraticCurveTo', 'canvas_rect',
			'canvas_requestAnimationFrame', 'canvas_restore', 'canvas_rotate', 'canvas_save',
			'canvas_scale', 'canvas_setFillStyle', 'canvas_setFont', 'canvas_setGlobalAlpha',
			'canvas_setHeight', 'canvas_setLineCap', 'canvas_setLineDashOffset',
			'canvas_setLineJoin', 'canvas_setLineWidth', 'canvas_setMiterLimit',
			'canvas_setShadowBlur', 'canvas_setShadowColor', 'canvas_setShadowOffsetX',
			'canvas_setShadowOffsetY', 'canvas_setStrokeStyle', 'canvas_setTextAlign',
			'canvas_setTextBaseline', 'canvas_setTransform', 'canvas_setWidth',
			'canvas_stroke', 'canvas_strokeRect', 'canvas_strokeText',
			'canvas_transform', 'canvas_translate'
		];
		for (const n of canvasNames) canvasStubs[n] = () => 0;

		const wasi_unstable: Record<string, any> = {
			...envImports,
			...memfs.exports // fd_write, fd_read, etc. from memfs
		};

		this.ready = WebAssembly.instantiate(module, {
			wasi_unstable,
			env: { ...canvasStubs }
		}).then(instance => {
			this.instance = instance;
			this.exports = instance.exports;
			this.mem = new Memory(this.exports.memory);
			this.memfs.hostMem = this.mem;
		});
	}

	private _getImportObject(names: string[]): Record<string, Function> {
		const result: Record<string, Function> = {};
		for (const name of names) {
			result[name] = (this as any)[name].bind(this);
		}
		return result;
	}

	async run(): Promise<App | null> {
		await this.ready;
		try {
			this.exports._start();
		} catch (exn: any) {
			if (exn instanceof ProcExit) {
				if (exn.code === 0) return null;
			}
			// Write error to hostWrite so it shows in stderr
			const msg = `\x1b[91mError: ${exn.message}\x1b[0m\n`;
			this.memfs.hostWrite(msg);
			throw exn;
		}
		return null;
	}

	proc_exit(code: number) { throw new ProcExit(code); }

	environ_sizes_get(environ_count_out: number, environ_buf_size_out: number): number {
		this.mem.check();
		const names = Object.getOwnPropertyNames(this.environ);
		let size = 0;
		for (const name of names) {
			size += name.length + this.environ[name].length + 2;
		}
		this.mem.write64(environ_count_out, names.length);
		this.mem.write64(environ_buf_size_out, size);
		return ESUCCESS;
	}

	environ_get(environ_ptrs: number, environ_buf: number): number {
		this.mem.check();
		const names = Object.getOwnPropertyNames(this.environ);
		for (const name of names) {
			this.mem.write32(environ_ptrs, environ_buf);
			environ_ptrs += 4;
			environ_buf += this.mem.writeStr(environ_buf, `${name}=${this.environ[name]}`);
		}
		this.mem.write32(environ_ptrs, 0);
		return ESUCCESS;
	}

	args_sizes_get(argc_out: number, argv_buf_size_out: number): number {
		this.mem.check();
		let size = 0;
		for (const arg of this.argv) size += arg.length + 1;
		this.mem.write64(argc_out, this.argv.length);
		this.mem.write64(argv_buf_size_out, size);
		return ESUCCESS;
	}

	args_get(argv_ptrs: number, argv_buf: number): number {
		this.mem.check();
		for (const arg of this.argv) {
			this.mem.write32(argv_ptrs, argv_buf);
			argv_ptrs += 4;
			argv_buf += this.mem.writeStr(argv_buf, arg);
		}
		this.mem.write32(argv_ptrs, 0);
		return ESUCCESS;
	}

	random_get(buf: number, buf_len: number) {
		const data = new Uint8Array(this.mem.buffer, buf, buf_len);
		for (let i = 0; i < buf_len; ++i) data[i] = (Math.random() * 256) | 0;
	}

	clock_time_get(_clock_id: number, _precision: number, time_out: number): number {
		this.mem.check();
		const now = BigInt(Date.now()) * 1_000_000n;
		const view = new DataView(this.mem.buffer);
		view.setBigUint64(time_out, now, true);
		return ESUCCESS;
	}

	poll_oneoff() { return ESUCCESS; }
}

// ── Tar unpacker ─────────────────────────────────────────────────────────────

class Tar {
	u8: Uint8Array;
	offset: number;

	constructor(buffer: ArrayBuffer) {
		this.u8 = new Uint8Array(buffer);
		this.offset = 0;
	}

	readStr(len: number): string {
		const result = readStr(this.u8, this.offset, len);
		this.offset += len;
		return result;
	}

	readOctal(len: number): number {
		return parseInt(this.readStr(len), 8);
	}

	alignUp() {
		this.offset = (this.offset + 511) & ~511;
	}

	readEntry(): any {
		if (this.offset + 512 > this.u8.length) return null;

		const entry: any = {
			filename: this.readStr(100),
			mode: this.readOctal(8),
			owner: this.readOctal(8),
			group: this.readOctal(8),
			size: this.readOctal(12),
			mtim: this.readOctal(12),
			checksum: this.readOctal(8),
			type: this.readStr(1),
			linkname: this.readStr(100),
		};

		if (this.readStr(8) !== 'ustar  ') return null;

		entry.ownerName = this.readStr(32);
		entry.groupName = this.readStr(32);
		entry.devMajor = this.readStr(8);
		entry.devMinor = this.readStr(8);
		entry.filenamePrefix = this.readStr(155);
		this.alignUp();

		if (entry.type === '0') {
			entry.contents = this.u8.subarray(this.offset, this.offset + entry.size);
			this.offset += entry.size;
			this.alignUp();
		} else if (entry.type !== '5') {
			// skip unknown types
		}
		return entry;
	}

	untar(memfs: MemFS) {
		let entry;
		while ((entry = this.readEntry())) {
			switch (entry.type) {
				case '0': memfs.addFile(entry.filename, entry.contents); break;
				case '5': memfs.addDirectory(entry.filename); break;
			}
		}
	}
}

// ── WasmClangAPI (main orchestrator) ─────────────────────────────────────────

class WasmClangAPI {
	moduleCache: Record<string, WebAssembly.Module> = {};
	compileStreaming: (filename: string) => Promise<WebAssembly.Module>;
	readBuffer: (filename: string) => Promise<ArrayBuffer>;
	hostWrite: (s: string) => void;
	memfs: MemFS;
	ready: Promise<void>;

	clangCommonArgs = [
		'-disable-free',
		'-isysroot', '/',
		'-internal-isystem', '/include/c++/v1',
		'-internal-isystem', '/include',
		'-internal-isystem', '/lib/clang/8.0.1/include',
		'-ferror-limit', '19',
		'-fmessage-length', '80',
		'-fcolor-diagnostics',
	];

	constructor(options: {
		compileStreaming: (f: string) => Promise<WebAssembly.Module>;
		readBuffer: (f: string) => Promise<ArrayBuffer>;
		hostWrite: (s: string) => void;
	}) {
		this.compileStreaming = options.compileStreaming;
		this.readBuffer = options.readBuffer;
		this.hostWrite = options.hostWrite;

		this.memfs = new MemFS({
			compileStreaming: this.compileStreaming,
			hostWrite: this.hostWrite,
			memfsFilename: 'memfs',
		});

		this.ready = this.memfs.ready.then(() => this.untar('sysroot.tar'));
	}

	async getModule(name: string): Promise<WebAssembly.Module> {
		if (this.moduleCache[name]) return this.moduleCache[name];
		const module = await this.compileStreaming(name);
		this.moduleCache[name] = module;
		return module;
	}

	async untar(filename: string) {
		await this.memfs.ready;
		const buffer = await this.readBuffer(filename);
		const tar = new Tar(buffer);
		tar.untar(this.memfs);
	}

	async compile(options: { input: string; contents: string; obj: string; lang?: 'c' | 'cpp' }) {
		await this.ready;
		this.memfs.addFile(options.input, options.contents);
		const clang = await this.getModule('clang');
		const langFlag = options.lang === 'c' ? 'c' : 'c++';
		return await this.runTool(
			clang, 'clang', '-cc1', '-emit-obj',
			...this.clangCommonArgs, '-O2',
			'-o', options.obj,
			'-x', langFlag,
			options.input
		);
	}

	async link(obj: string, wasm: string) {
		const stackSize = 1024 * 1024;
		const libdir = 'lib/wasm32-wasi';
		const crt1 = `${libdir}/crt1.o`;
		await this.ready;
		const lld = await this.getModule('lld');
		return await this.runTool(
			lld, 'wasm-ld', '--no-threads',
			'--export-dynamic',
			'-z', `stack-size=${stackSize}`,
			`-L${libdir}`, crt1, obj,
			'-lc', '-lc++', '-lc++abi', '-lcanvas',
			'-o', wasm
		);
	}

	async runTool(module: WebAssembly.Module, name: string, ...args: string[]): Promise<App | null> {
		const app = new App(module, this.memfs, name, ...args);
		const result = await app.run();
		return result;
	}

	async compileLinkRun(contents: string, lang: 'c' | 'cpp' = 'cpp') {
		const ext = lang === 'c' ? 'c' : 'cc';
		const input = `test.${ext}`;
		const obj = 'test.o';
		const wasm = 'test.wasm';

		await this.compile({ input, contents, obj, lang });
		await this.link(obj, wasm);

		const buffer = this.memfs.getFileContents(wasm);
		const testMod = await WebAssembly.compile(buffer.slice().buffer);
		return await this.runTool(testMod, wasm);
	}
}

// ── ANSI stripping ───────────────────────────────────────────────────────────

const ANSI_RE = new RegExp(
	'[\\u001b\\u009b][[\\]()#;?]*(?:(?:(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><~]))',
	'g'
);
function stripAnsi(s: string): string { return s.replace(ANSI_RE, ''); }

// ── Worker singleton ─────────────────────────────────────────────────────────

let api: WasmClangAPI | null = null;

async function compileStreaming(filename: string): Promise<WebAssembly.Module> {
	const response = await fetch(`/${filename}`);
	return WebAssembly.compile(await response.arrayBuffer());
}

async function readBuffer(filename: string): Promise<ArrayBuffer> {
	const response = await fetch(`/${filename}`);
	return response.arrayBuffer();
}

function getApi(hostWrite: (s: string) => void): WasmClangAPI {
	if (!api) {
		api = new WasmClangAPI({ compileStreaming, readBuffer, hostWrite });
	}
	return api;
}

// ── Worker message handler ───────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
	const { id, code, lang, stdin } = e.data as { id: string; code: string; lang: 'c' | 'cpp'; stdin: string };

	let output = '';

	const hostWrite = (s: string) => { output += s; };

	try {
		const instance = getApi(hostWrite);
		// Update hostWrite reference for this run
		instance.hostWrite = hostWrite;
		instance.memfs.hostWrite = hostWrite;
		instance.memfs.setStdinStr(stdin ?? '');
		await instance.compileLinkRun(code, lang);

		const cleaned = stripAnsi(output);
		// Separate stderr (lines starting with '>' or 'Error') from stdout
		const lines = cleaned.split('\n');
		const stdoutLines: string[] = [];
		const stderrLines: string[] = [];

		let inOutput = false;
		for (const line of lines) {
			// Skip the internal tool invocation logs (lines starting with > )
			if (line.startsWith('> ') || line.startsWith('>')) {
				// These are toolchain log messages, skip them
				continue;
			}
			if (line.includes('Error:') || line.includes('error:') || line.includes('warning:')) {
				stderrLines.push(line);
			} else {
				stdoutLines.push(line);
			}
		}

		(self as any).postMessage({
			id,
			stdout: stdoutLines.join('\n').trim(),
			stderr: stderrLines.join('\n').trim(),
			exitCode: 0
		});
	} catch (err: any) {
		const cleaned = stripAnsi(output);
		const errMsg = err instanceof ProcExit
			? (err.code === 0 ? '' : `Process exited with code ${err.code}`)
			: (err?.message ?? String(err));

		(self as any).postMessage({
			id,
			stdout: '',
			stderr: (cleaned + '\n' + errMsg).trim(),
			exitCode: err instanceof ProcExit ? err.code : 1
		});
	}
};
