// Override module resolution to skip node_modules/electron
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
    if (request === 'electron') {
        // Force it to fail, triggering Electron's internal fallback
        const err = new Error("Cannot find module 'electron'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
    }
    return originalResolve.call(this, request, parent, isMain, options);
};

try {
    const e = require('electron');
    console.log('Got electron:', typeof e, 'app:', typeof e.app);
} catch (err) {
    console.log('Error:', err.message);
}
