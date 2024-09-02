"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fsp = __importStar(require("fs/promises"));
const commander_1 = require("commander");
const big_js_1 = __importDefault(require("big.js"));
const luxon_1 = require("luxon");
const percentile_1 = __importDefault(require("percentile"));
big_js_1.default.DP = 2;
big_js_1.default.RM = big_js_1.default.roundHalfUp;

async function processStats(statsDir, outFile) {
    console.log(`Processing stats directory: ${statsDir}`);
    const statsFiles = await fsp.readdir(statsDir);
    const writeStream = await fsp.appendFile(outFile, 'var projectLevelStats = [');
    let firstFile = true;
    for (const statsFile of statsFiles) {
        const stats = await processStatsFile(path.join(statsDir, statsFile));
        if (firstFile) {
            firstFile = false;
        }
        else {
            await fsp.appendFile(outFile, ',');
        }
        await fsp.appendFile(outFile, JSON.stringify(stats));
    }
    await fsp.appendFile(outFile, '];');
}

async function processStatsFile(statsFile) {
    console.log(`Processing stats file: ${statsFile}`);
    const statsContent = await fsp.readFile(statsFile);
    const stats = JSON.parse(statsContent.toString());
    return collectStats(path.basename(statsFile, '.json'), stats);
}

function collectStats(fileName, inStats) {
    const commits = inStats.commits || []; // Ensure commits is always an array

    // Ensure patchSetCount is defined
    const patchSetCount = commits.reduce((agg, commit) => agg + (commit.patchSetCount || 0), 0);
    const maxPatchSetCount = commits.reduce((agg, commit) => Math.max(agg, commit.patchSetCount || 0), 0);
    
    const reviewCountPlus2 = countReviews(commits, '2');
    const reviewCountPlus1 = countReviews(commits, '1');
    const reviewCountMinus1 = countReviews(commits, '-1');
    const reviewCountMinus2 = countReviews(commits, '-2');

    const abandonedCount = commits.filter((c) => c.status === 'ABANDONED').length;

    const reviewDurations = commits.map((commit) => {
        const duration = getReviewDuration(commit);
        return duration.as('seconds');
    });

    const averageReviewDuration = new big_js_1.default(reviewDurations.reduce((agg, durationInSeconds) => agg + durationInSeconds, 0)).div(commits.length || 1);
    const maxReviewDuration = Math.max(...reviewDurations);
    const perc95ReviewDuration = percentile_1.default(95, reviewDurations);
    const perc75ReviewDuration = percentile_1.default(75, reviewDurations);

    const maxTimeToFirstApproval = Math.max(...commits
        .map((c) => getTimeToFirstApproval(c))
        .filter((d) => d !== undefined)
        .map((d) => d.as('seconds')));

    const stats = {
        repo: fileName,
        commitCount: commits.length,
        patchSetCount: patchSetCount,
        avgPatchSetCount: new big_js_1.default(patchSetCount).div(commits.length || 1).toNumber(),
        maxPatchSetCount,
        reviewCountPlus2,
        reviewCountPlus1,
        reviewCountMinus1,
        reviewCountMinus2,
        abandonedCount,
        averageReviewDuration: averageReviewDuration.toNumber() * 1000,
        perc75ReviewDuration: perc75ReviewDuration * 1000,
        perc95ReviewDuration: perc95ReviewDuration * 1000,
        maxReviewDuration: maxReviewDuration * 1000,
        maxTimeToFirstApproval: maxTimeToFirstApproval * 1000
    };

    const commitStats = commits.map((c) => {
        const timeToFirstApproval = getTimeToFirstApproval(c);
        return {
            number: c.number,
            changeId: c.changeId,
            owner: c.owner,
            subject: c.subject,
            createdOn: luxon_1.DateTime.fromISO(c.createdOn).toISO(), // Assuming ISO format
            lastUpdatedOn: luxon_1.DateTime.fromISO(c.lastUpdatedOn).toISO(), // Assuming ISO format
            reviewDuration: getReviewDuration(c).as('milliseconds'),
            status: c.status,
            patchSetCount: c.patchSetCount || 0,
            timeToFirstApproval: timeToFirstApproval ? timeToFirstApproval.as('milliseconds') : undefined,
            sizeInsertions: c.sizeInsertions || 0,
            sizeDeletions: c.sizeDeletions || 0
        };
    });

    stats.commits = commitStats;
    console.log(`  Stats:\n${JSON.stringify(stats, null, ' ')}`);
    return stats;
}

function getTimeToFirstApproval(commit) {
    const firstApproval = findFirstCodeReview(commit);
    return firstApproval ? luxon_1.Duration.fromMillis((firstApproval.grantedOn - new Date(commit.createdOn).getTime()) * 1000) : undefined;
}

function countReviews(commits, value) {
    return commits.reduce((agg, commit) => {
        const patchSetCounts = (commit.patchSets || [])
            .filter((ps) => ps.approvals)
            .map((ps) => ps.approvals.filter((a) => a.type === 'Code-Review' && a.value === value).length);
        return agg + patchSetCounts.reduce((agg, count) => agg + count, 0);
    }, 0);
}

function getReviewDuration(commit) {
    return luxon_1.Duration.fromMillis((new Date(commit.lastUpdatedOn).getTime() - new Date(commit.createdOn).getTime()));
}

function findFirstCodeReview(commit) {
    for (let patchSet of commit.patchSets || []) {
        if (patchSet.approvals) {
            const codeReview = patchSet.approvals.find((a) => a.type === 'Code-Review');
            if (codeReview) {
                return codeReview;
            }
        }
    }
    return null;
}

async function main() {
    const program = new commander_1.Command();
    program
        .version('1.0.0')
        .description('Generate gerrit statistics')
        .option('-d, --directory <directory>', 'Directory containing the project stats.')
        .option('-o, --out-file <outFile>', 'Output file for project level stats')
        .parse(process.argv);
    const options = program.opts();
    await processStats(options.directory, options.outFile);
}

main().catch((err) => console.error('Error', err));

