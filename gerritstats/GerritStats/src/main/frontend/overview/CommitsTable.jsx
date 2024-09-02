import React from 'react';
import {Td, Tr} from 'reactable';

import Reactable from 'reactable';

import SimpleSortableTable from '../common/SimpleSortableTable';

import Panel from '../common/Panel';
import ProjectsTable from './ProjectsTable';
import {formatPrintableDuration} from '../common/time/TimeUtils';
import {Link} from 'react-router';

export default class CommitsTable extends React.Component {
    constructor(props) {
        super(props);

        const projectName = this.props.params.projectName;
        const projectData = this.props.route.overviewProjectsData.find(project => project.repo === projectName);
        const commits = projectData ? projectData.commits : [];

        this.state = {
            overviewProjectsData: this.props.route.overviewProjectsData,
            columnMetadata: this.getDefaultColumnMetadata(projectName),
            projectName,
            commits
        };
    }

    getDefaultColumnMetadata(projectName) {
        return {
            'number': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Commit number.',
                header: 'Number',
                cell: (record, index) => (
                    <Td key={'number' + index} column='number' value={record.number}>
                        <a href={'https://gerrit.cloudsenseltd.com/gerrit/c/' + projectName + '/+/' + record.number}>{record.number}</a>
                    </Td>
                ),
            },
            'owner': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'Owner',
                header: 'Owner',
                cell: (record, index) => (
                    <Td key={'owner' + index} column='owner' value={record.owner}>
                        {record.owner}
                    </Td>
                ),
            },
            'subject': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'Subject',
                header: 'Subject',
                cell: (record, index) => (
                    <Td key={'subject' + index} column='subject' value={record.subject}>
                        {record.subject}
                    </Td>
                ),
            },
            'createdOn': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'Created on',
                header: 'Created on',
                cell: (record, index) => (
                    <Td key={'createdOn' + index} column='createdOn' value={record.createdOn}>
                        {record.createdOn}
                    </Td>
                ),
            },
            'lastUpdatedOn': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'Last updated on',
                header: 'Updated on',
                cell: (record, index) => (
                    <Td key={'lastUpdatedOn' + index} column='lastUpdatedOn' value={record.lastUpdatedOn}>
                        {record.lastUpdatedOn}
                    </Td>
                ),
            },
            'status': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'Status',
                header: 'Status',
                cell: (record, index) => (
                    <Td key={'status' + index} column='status' value={record.status}>
                        {record.status}
                    </Td>
                ),
            },
            'patchSetCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Patch set count',
                header: 'Patch sets',
                cell: (record, index) => (
                    <Td key={'patchSetCount' + index} column='patchSetCount' value={record.patchSetCount}>
                        {record.patchSetCount}
                    </Td>
                ),
            },
            'sizeInsertions': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of insertions',
                header: 'Insertions',
                cell: (record, index) => (
                    <Td key={'sizeInsertions' + index} column='sizeInsertions' value={record.sizeInsertions}>
                        {record.sizeInsertions}
                    </Td>
                ),
            },
            'sizeDeletions': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Number of deletions',
                header: 'Deletions',
                cell: (record, index) => (
                    <Td key={'sizeDeletions' + index} column='sizeDeletions' value={record.sizeDeletions}>
                        {record.sizeDeletions}
                    </Td>
                ),
            },
            'size': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Size of a change',
                header: 'Size',
                cell: (record, index) => (
                    <Td key={'size' + index} column='size' value={record.sizeDeletions + record.sizeInsertions}>
                        {record.sizeDeletions + record.sizeInsertions}
                    </Td>
                ),
            },
            'reviewDuration': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Review time',
                header: 'Review time',
                cell: (record, index) => (
                    <Td key={'reviewDuration' + index}
                        column='reviewDuration' value={record.reviewDuration}
                        style={this.computeCellStyle(index, 'reviewDuration')}>
                        {formatPrintableDuration(record.reviewDuration)}
                    </Td>
                ),
            },
            'timeToFirstApproval': {
                sortFunction: Reactable.Sort.NumericInteger,
                description: 'Time to first approval',
                header: (<span>Time to first<br/>approval</span>),
                cell: (record, index) => (
                    <Td key={'timeToFirstApproval' + index}
                        column='timeToFirstApproval' value={record.timeToFirstApproval ? record.timeToFirstApproval : record.reviewDuration}
                        style={this.computeCellStyle(index, 'timeToFirstApproval')}>
                        {formatPrintableDuration(record.timeToFirstApproval)}
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
                        <div className="subtitleH1">Commit Stats > {this.state.projectName}</div>
                    </div>
                </header>
                <content>
                    <Panel title='Commits Overview' size='flex'>
                        <SimpleSortableTable
                            columnMetadata={this.state.columnMetadata}
                            rowData={this.state.commits}
                            rowRenderer={this.renderRow.bind(this)} />
                    </Panel>
                </content>
            </div>
        );
    }
}

CommitsTable.displayName = 'CommitsTable';

CommitsTable.defaultProps = {
    overviewProjectsData: []
};

ProjectsTable.propTypes = {
    route: React.PropTypes.shape({
        overviewProjectsData: React.PropTypes.array.isRequired
    })
};

CommitsTable.COLOR_UNSELECTED = '#cccccc';
