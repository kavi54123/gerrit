import '../common/header/PageHeader.scss';

import React from 'react';
import {Td, Tr} from 'reactable';
import {Link} from 'react-router';
import Reactable from 'reactable';

import SimpleSortableTable from '../common/SimpleSortableTable';
import {formatPrintableDuration} from '../common/time/TimeUtils';

import Panel from '../common/Panel';


export default class ProjectsTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            overviewProjectsData: this.props.route.overviewProjectsData,
            columnMetadata: this.getDefaultColumnMetadata()
        };
    }

    getDefaultColumnMetadata() {
        return {
            'project': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'The project name.',
                header: 'Project',
                cell: (record, index) => (
                    <Td key={'project' + index} column='project' value={record.repo}>
                        <Link to={'/commits/' + record.repo}>{record.repo}</Link>
                    </Td>
                ),
            },
            'commitCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of commits in the project.',
                header: 'Commits',
                cell: (record, index) => (
                    <Td key={'commitCount' + index} column='commitCount'
                        style={this.computeCellStyle(index, 'commitCount')}>
                        {record.commitCount}
                    </Td>
                ),
            },
            'patchSetCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of patch sets in the project.',
                header: 'Patch sets',
                cell: (record, index) => (
                    <Td key={'patchSetCount' + index} column='patchSetCount'
                        style={this.computeCellStyle(index, 'patchSetCount')}>
                        {record.patchSetCount}
                    </Td>
                ),
            },
            'avgPatchSetCount': {
                sortFunction: Reactable.Sort.Numeric,
                description: 'Average number of patch sets per commit.',
                header: 'Patch sets (avg)',
                cell: (record, index) => (
                    <Td key={'avgPatchSetCount' + index} column='avgPatchSetCount'
                        style={this.computeCellStyle(index, 'avgPatchSetCount')}>
                        {record.avgPatchSetCount}
                    </Td>
                ),
            },
            'maxPatchSetCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Max number of patch sets per commit.',
                header: 'Patch sets (max)',
                cell: (record, index) => (
                    <Td key={'maxPatchSetCount' + index} column='maxPatchSetCount'
                        style={this.computeCellStyle(index, 'maxPatchSetCount')}>
                        {record.maxPatchSetCount}
                    </Td>
                ),
            },
            'reviewCountPlus2': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of +2 reviews.',
                header: '+2 given',
                cell: (record, index) => (
                    <Td key={'reviewCountPlus2' + index} column='reviewCountPlus2'
                        style={this.computeCellStyle(index, 'reviewCountPlus2')}>
                        {record.reviewCountPlus2}
                    </Td>
                ),
            },
            'reviewCountPlus1': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of +1 reviews.',
                header: '+1 given',
                cell: (record, index) => (
                    <Td key={'reviewCountPlus1' + index} column='reviewCountPlus1'
                        style={this.computeCellStyle(index, 'reviewCountPlus1')}>
                        {record.reviewCountPlus1}
                    </Td>
                ),
            },
            'reviewCountMinus1': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of -1 reviews.',
                header: '-1 given',
                cell: (record, index) => (
                    <Td key={'reviewCountMinus1' + index} column='reviewCountMinus1'
                        style={this.computeCellStyle(index, 'reviewCountMinus1')}>
                        {record.reviewCountMinus1}
                    </Td>
                ),
            },
            'reviewCountMinus2': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of -2 reviews.',
                header: '-2 given',
                cell: (record, index) => (
                    <Td key={'reviewCountMinus2' + index} column='reviewCountMinus2'
                        style={this.computeCellStyle(index, 'reviewCountMinus2')}>
                        {record.reviewCountMinus2}
                    </Td>
                ),
            },
            'abandonedCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of abandoned commits.',
                header: 'Abandoned',
                cell: (record, index) => (
                    <Td key={'abandonedCount' + index} column='abandonedCount'
                        style={this.computeCellStyle(index, 'abandonedCount')}>
                        {record.abandonedCount}
                    </Td>
                ),
            },
            'averageReviewDuration': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Average time commits spent in review.',
                header: (<span>Time in review<br/>(avg)</span>),
                cell: (record, index) => (
                    <Td key={'averageReviewDuration' + index}
                        column='averageReviewDuration' value={record.averageReviewDuration}
                        style={this.computeCellStyle(index, 'averageReviewDuration')}>
                        {formatPrintableDuration(record.averageReviewDuration)}
                    </Td>
                ),
            },
            'perc75ReviewDuration': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Review duration 75th perc.',
                header: (<span>Time in review<br/>(75th perc)</span>),
                cell: (record, index) => (
                    <Td key={'perc75ReviewDuration' + index}
                        column='perc75ReviewDuration' value={record.perc75ReviewDuration}
                        style={this.computeCellStyle(index, 'perc75ReviewDuration')}>
                        {formatPrintableDuration(record.perc75ReviewDuration)}
                    </Td>
                ),
            },
            'perc95ReviewDuration': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Review duration 50th perc.',
                header: (<span>Time in review<br/>(95th perc)</span>),
                cell: (record, index) => (
                    <Td key={'perc95ReviewDuration' + index}
                        column='perc95ReviewDuration' value={record.perc95ReviewDuration}
                        style={this.computeCellStyle(index, 'perc95ReviewDuration')}>
                        {formatPrintableDuration(record.perc95ReviewDuration)}
                    </Td>
                ),
            },
            'maxReviewDuration': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Max review duration',
                header: (<span>Time in review<br/>(max)</span>),
                cell: (record, index) => (
                    <Td key={'maxReviewDuration' + index}
                        column='maxReviewDuration' value={record.maxReviewDuration}
                        style={this.computeCellStyle(index, 'maxReviewDuration')}>
                        {formatPrintableDuration(record.maxReviewDuration)}
                    </Td>
                ),
            },
            'maxTimeToFirstApproval': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Max time to first approval',
                header: (<span>Max time to<br/>first approval</span>),
                cell: (record, index) => (
                    <Td key={'maxTimeToFirstApproval' + index}
                        column='maxTimeToFirstApproval' value={record.maxTimeToFirstApproval}
                        style={this.computeCellStyle(index, 'maxTimeToFirstApproval')}>
                        {formatPrintableDuration(record.maxTimeToFirstApproval)}
                    </Td>
                ),
            },
            'userStats': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'User stats',
                header: 'User stats',
                cell: (record, index) => (
                    <Td key={'userStats' + index} column='userStats'>
                        <a href={'../' + record.repo + '/index.html'}>stats</a>
                    </Td>
                ),
            },
        };
    }

    computeCellStyle(index, columnName) {
        const metadata = this.state.columnMetadata[columnName];
        var style = {};
        if (metadata.highlighter) {
            const backgroundColor = metadata.highlighter.getHighlightColor(index);
            if (backgroundColor && backgroundColor.length > 0) {
                style.backgroundColor = backgroundColor;
            }
        }
        return style;
    }

    renderRow(index, overviewRecord) {
        const selectionStyle = {
            color: ''
        };
        var rowCells = Object.keys(this.state.columnMetadata).map(function(columnName) {
            const metadata = this.state.columnMetadata[columnName];
            return metadata.cell(overviewRecord, index);
        }.bind(this));

        return (
            <Tr key={'r_' + index} style={selectionStyle}>
                {rowCells}
            </Tr>
        );
    }

    render() {
        return (
            <div>
                <header>
                    <div style={{display:'inline-block'}}>
                        <h1 className='pageTitle'>GerritStats</h1>
                        <div className="subtitleH1">Project Level Stats</div>
                    </div>
                </header>
                <content>
                    <Panel title='Projects Overview' size='flex'>
                        <SimpleSortableTable
                            columnMetadata={this.state.columnMetadata}
                            rowData={this.state.overviewProjectsData}
                            rowRenderer={this.renderRow.bind(this)} />
                    </Panel>
                </content>
            </div>
        );
    }
}

ProjectsTable.displayName = 'ProjectsTable';

ProjectsTable.defaultProps = {
    overviewProjectsData: []
};

ProjectsTable.propTypes = {
    route: React.PropTypes.shape({
        overviewProjectsData: React.PropTypes.array.isRequired
    })
};

ProjectsTable.COLOR_UNSELECTED = '#cccccc';
