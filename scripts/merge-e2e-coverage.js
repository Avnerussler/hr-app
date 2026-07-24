const fs = require('fs');
const path = require('path');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const target = process.argv[2] || 'frontend';

const sources =
    target === 'server'
        ? [{ dir: path.join(process.cwd(), '.nyc_output_server'), fromNycTemp: true }]
        : target === 'all'
          ? [
                { dir: path.join(process.cwd(), '.nyc_output_raw'), fromNycTemp: false },
                { dir: path.join(process.cwd(), '.nyc_output_server'), fromNycTemp: true },
            ]
          : [{ dir: path.join(process.cwd(), '.nyc_output_raw'), fromNycTemp: false }];

const outDir = path.join(process.cwd(), `coverage-e2e${target === 'frontend' ? '' : `-${target}`}`);

const map = libCoverage.createCoverageMap({});
let found = 0;

for (const { dir } of sources) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
        if (!file.endsWith('.json')) continue;
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        map.merge(data);
        found++;
    }
}

if (found === 0) {
    console.error(
        `No coverage data found. Frontend: run e2e with VITE_COVERAGE=true. Server: run "npm run dev:coverage --workspace=apps/server".`
    );
    process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const context = libReport.createContext({ dir: outDir, coverageMap: map });
for (const reporter of ['html', 'text', 'text-summary', 'json-summary']) {
    reports.create(reporter).execute(context);
}

console.log(`Coverage report (${target}) written to ${outDir}/index.html`);
