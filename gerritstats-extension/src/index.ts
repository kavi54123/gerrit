import fs = require('fs');
import * as path from 'path';
import * as fsp from 'fs/promises';
import { Command } from 'commander';
import Big from 'big.js';
import { DateTime, Duration, DurationObject } from 'luxon';
import { default as percentile } from 'percentile';

Big.DP = 2;
Big.RM = Big.roundHalfUp;

async function processStats(statsDir: string, outFile: string): Promise<void> {
  console.log(`Processing stats directory: ${statsDir}`);
  const statsFiles = await fsp.readdir(statsDir);
  const writeStream = await fsp.appendFile(outFile, 'var projectLevelStats = [');
  let firstFile = true;
  for (const statsFile of statsFiles) {
    const stats = await processStatsFile(path.join(statsDir, statsFile));
    if (firstFile) {
      firstFile = false;
    } else {
      await fsp.appendFile(outFile, ',');
    }
    await fsp.appendFile(outFile, JSON.stringify(stats));
  }
  await fsp.appendFile(outFile, '];');
}

async function processStatsFile(statsFile: string): Promise<any> {
  console.log(`Processing stats file: ${statsFile}`);
  const statsContent = await fsp.readFile(statsFile);
  const stats = JSON.parse(statsContent.toString());
  return collectStats(path.basename(statsFile, '.json'), stats);
}

function collectStats(fileName: string, inStats: any): any {
  const commits = inStats.commits;
  const patchSetCount = commits.reduce((agg: number, commit: any) => agg + countPatchSets(commit), 0);
  const maxPatchSetCount = commits.reduce((agg: number, commit: any) => Math.max(agg, countPatchSets(commit)), 0);
  const reviewCountPlus2 = countReviews(commits, '2');
  const reviewCountPlus1 = countReviews(commits, '1');
  const reviewCountMinus1 = countReviews(commits, '-1');
  const reviewCountMinus2 = countReviews(commits, '-2');
  // todo: add self-review
  const abandonedCount = commits.filter((c: any) => c.status === 'ABANDONED').length;
  const reviewDurations = commits.map((commit: any) => {
    const duration = getReviewDuration(commit);
    return duration.as('seconds');
  });
  const averageReviewDuration = new Big(
    reviewDurations.reduce((agg: number, durationInSeconds: number) => agg + durationInSeconds, 0)
  ).div(commits.length);
  const maxReviewDuration = Math.max(...reviewDurations);
  const perc95ReviewDuration = percentile(95, reviewDurations) as number;
  const perc75ReviewDuration = percentile(75, reviewDurations) as number;
  const maxTimeToFirstApproval = Math.max(
    ...commits
      .map((c: any) => getTimeToFirstApproval(c))
      .filter((d: Duration) => d !== undefined)
      .map((d: Duration) => d.as('seconds'))
  );

  const stats: any = {
    repo: fileName,
    commitCount: commits.length,
    patchSetCount: patchSetCount,
    avgPatchSetCount: new Big(patchSetCount).div(commits.length).toNumber(),
    maxPatchSetCount,
    reviewCountPlus2,
    reviewCountPlus1,
    reviewCountMinus1,
    reviewCountMinus2,
    abandonedCount,
    // averageReviewDuration: toDurationObj(Duration.fromMillis(averageReviewDuration.toNumber() * 1000)),
    averageReviewDuration: averageReviewDuration.toNumber() * 1000,
    // perc75ReviewDuration: toDurationObj(Duration.fromMillis(perc75ReviewDuration * 1000)),
    perc75ReviewDuration: perc75ReviewDuration * 1000,
    // perc95ReviewDuration: toDurationObj(Duration.fromMillis(perc95ReviewDuration * 1000)),
    perc95ReviewDuration: perc95ReviewDuration * 1000,
    // maxReviewDuration: toDurationObj(Duration.fromMillis(maxReviewDuration * 1000)),
    maxReviewDuration: maxReviewDuration * 1000,
    // maxTimeToFirstApproval: toDurationObj(Duration.fromMillis(maxTimeToFirstApproval * 1000))
    maxTimeToFirstApproval: maxTimeToFirstApproval * 1000
  };
  const commitStats = commits.map((c: any) => {
    const timeToFirstApproval = getTimeToFirstApproval(c);
    return {
      number: c.number,
      changeId: c.id,
      owner: c.owner.username,
      subject: c.subject,
      createdOn: DateTime.fromSeconds(c.createdOn).toISO(),
      lastUpdatedOn: DateTime.fromSeconds(c.lastUpdated).toISO(),
      // reviewDuration: toDurationObj(getReviewDuration(c)),
      reviewDuration: getReviewDuration(c).as('milliseconds'),
      status: c.status,
      patchSetCount: countPatchSets(c),
      // timeToFirstApproval: timeToFirstApproval ? toDurationObj(timeToFirstApproval) : undefined,
      timeToFirstApproval: timeToFirstApproval ? timeToFirstApproval.as('milliseconds') : undefined,
      sizeInsertions: getSizeInsertions(c),
      sizeDeletions: getSizeDeletions(c)
    };
  });
  stats.commits = commitStats;
  console.log(`  Stats:\n${JSON.stringify(stats, null, ' ')}`);
  return stats;
}

function getTimeToFirstApproval(commit: any): Duration | undefined {
  const firstApproval = findFirstCodeReview(commit);
  return firstApproval ? Duration.fromMillis((firstApproval.grantedOn - commit.createdOn) * 1000) : undefined;
}

function toDurationObj(duration: Duration): DurationObject {
  return duration.shiftTo('days', 'hours', 'minutes', 'seconds', 'milliseconds').toObject();
}

function countReviews(commits: any, value: string): number {
  return commits.reduce((agg: number, commit: any) => {
    const patchSetCounts: number[] = commit.patchSets
      .filter((ps: any) => ps.approvals)
      .map((ps: any) => ps.approvals.filter((a: any) => a.type === 'Code-Review' && a.value === value).length);
    return agg + patchSetCounts.reduce((agg: number, count: number) => agg + count, 0);
  }, 0);
}

function countPatchSets(commit: any): number {
  return commit.patchSets.length;
}

function getReviewDuration(commit: any): Duration {
  return Duration.fromMillis((commit.lastUpdated - commit.createdOn) * 1000);
}

function findFirstCodeReview(commit: any) {
  for (let patchSet of commit.patchSets) {
    if (patchSet.approvals) {
      const codeReview = patchSet.approvals.find((a: any) => a.type === 'Code-Review');
      if (codeReview) {
        return codeReview;
      }
    }
  }
  return null;
}

function getSizeDeletions(commit: any): number {
  const lastPatchSet = findLastPatchSet(commit);
  return lastPatchSet.sizeDeletions;
}

function getSizeInsertions(commit: any): number {
  const lastPatchSet = findLastPatchSet(commit);
  return lastPatchSet.sizeInsertions;
}

function findLastPatchSet(commit: any) {
  return commit.patchSets[commit.patchSets.length - 1];
}

async function main() {
  const program = new Command();
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
