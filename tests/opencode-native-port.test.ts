import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveOpencodeNativePort } from "../src/config.ts";

test("OpenCode native port reads only an explicit, valid file port", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bili-opencode-port-"));
    const previous = { BILI_CONFIG_FILE: process.env.BILI_CONFIG_FILE, ACP_PORT: process.env.ACP_PORT, PORT: process.env.PORT };
    const file = path.join(dir, "billion-context.json");
    process.env.BILI_CONFIG_FILE = file;
    process.env.ACP_PORT = "9999";
    process.env.PORT = "9998";
    try {
        assert.equal(resolveOpencodeNativePort(), 0, "missing file preserves automatic selection");
        fs.writeFileSync(file, JSON.stringify({ host: "0.0.0.0" }));
        assert.equal(resolveOpencodeNativePort(), 0, "no standalone or environment default");
        for (const port of [1, 8787, 65535]) {
            fs.writeFileSync(file, JSON.stringify({ port }));
            assert.equal(resolveOpencodeNativePort(), port);
        }
        for (const port of [0, -1, 65536, 12.5, "8787", null, true, {}, []]) {
            fs.writeFileSync(file, JSON.stringify({ port }));
            assert.throws(resolveOpencodeNativePort, /port in .*billion-context\.json must be an integer between 1 and 65535/);
        }
    } finally {
        for (const [key, value] of Object.entries(previous)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
