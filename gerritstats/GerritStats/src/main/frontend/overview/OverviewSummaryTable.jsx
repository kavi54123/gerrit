import React from 'react';
import {Td, Tr} from 'reactable';
import {Link} from 'react-router';
import Reactable from 'reactable';

import SimpleSortableTable from '../common/SimpleSortableTable';
import {getPrintableName, getProfilePageLinkForIdentity} from '../common/model/GerritUserdata';
import SelectedUsers from '../common/model/SelectedUsers';

import TableCellHighlighter from './TableCellHighlighter';

export default class OverviewSummaryTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedUsers: this.props.selectedUsers,
            columnMetadata: this.getDefaultColumnMetadata()
        };
    }

    getDefaultColumnMetadata() {
        const overviewUserdata = this.props.overviewUserdata;
        // Use props as this is only called in constructor
        const selectedUsers = this.props.selectedUsers;

        return {
            'selected': {
                header: () => (
                    <input name='selectAll' type='checkbox'
                           checked={this.state.selectedUsers.isAllUsersSelected()}
                           onChange={this.onSelectAllCheckboxValueChanged.bind(this)} />
                ),
                cell: (record, index) => (
                    <Td key={'selected' + index} column='selected'>
                        <input data-identifier={record.identifier}
                               type='checkbox'
                               checked={this.state.selectedUsers.isUserSelected(record.identifier)}
                               onChange={() => this.onIdentityCheckboxValueChanged(record.identifier)} />
                    </Td>
                ),
            },
            'name': {
                sortFunction: Reactable.Sort.CaseInsensitive,
                description: 'The name of the user, as shown in Gerrit.',
                header: 'Name',
                cell: (record, index) => (
                    <Td key={'name' + index} column='name' value={getPrintableName(record.identity)}>
                        <Link to={getProfilePageLinkForIdentity(record.identifier)}>{getPrintableName(record.identity)}</Link>
                    </Td>
                ),
            },
            'positiveReviewCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                highlighter: new TableCellHighlighter(overviewUserdata, selectedUsers, 'positiveReviewCount'),
                description: 'Number of +1 and +2 reviews given by this user.',
                header: (<span>+1 & +2<br/>given</span>),
                cell: (record, index) => (
                    <Td key={'positiveReviewCount' + index} column='positiveReviewCount'
                        style={this.computeCellStyle(index, 'positiveReviewCount')}>
                        {record.positiveReviewCount}
                    </Td>
                ),
            },
            'negativeReviewCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                highlighter: new TableCellHighlighter(overviewUserdata, selectedUsers, 'negativeReviewCount'),
                description: 'Number of -1 and -2 reviews given by this user.',
                header: (<span>-1 & -2<br/>given</span>),
                cell: (record, index) => (
                    <Td key={'negativeReviewCount' + index} column='negativeReviewCount'
                        style={this.computeCellStyle(index, 'negativeReviewCount')}>
                        {record.negativeReviewCount}
                    </Td>
                ),
            },
            'inReviewCommitCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                highlighter: new TableCellHighlighter(overviewUserdata, selectedUsers, 'inReviewCommitCount'),
                description: 'Number of commits currently in review by this user.',
                header: 'In review',
                cell: (record, index) => (
                    <Td key={'inReviewCommitCount' + index} column='inReviewCommitCount'
                        style={this.computeCellStyle(index, 'inReviewCommitCount')}>
                        {record.inReviewCommitCount}
                    </Td>
                ),
            },
            'abandonedCommitCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                highlighter: new TableCellHighlighter(overviewUserdata, selectedUsers, 'abandonedCommitCount'),
                description: 'Number of abandoned commits.',
                header: 'Abandoned',
                cell: (record, index) => (
                    <Td key={'abandonedCommitCount' + index} column='abandonedCommitCount'
                        style={this.computeCellStyle(index, 'abandonedCommitCount')}>
                        {record.abandonedCommitCount}
                    </Td>
                ),
            },
            'mergedCommitCount': {
                sortFunction: Reactable.Sort.NumericInteger,
                highlighter: new TableCellHighlighter(overviewUserdata, selectedUsers, 'mergedCommitCount'),
                description: 'Number of commits that are neither in review nor abandoned.',
                header: 'Merged',
                cell: (record, index) => (
                    <Td key={'mergedCommitCount' + index} column='mergedCommitCount'
                        style={this.computeCellStyle(index, 'mergedCommitCount')}>
                        {record.mergedCommitCount}
                    </Td>
                ),
            },
        };
    }

    componentWillReceiveProps(nextProps) {
        Object.keys(this.state.columnMetadata).forEach(function(columnName) {
            const metadata = this.state.columnMetadata[columnName];
            if (metadata.highlighter) {
                metadata.highlighter.setOverviewUserdata(nextProps.overviewUserdata);
            }
        }.bind(this));

        if (!nextProps.selectedUsers.equals(this.state.selectedUsers)) {
            this.setState({
                selectedUsers: nextProps.selectedUsers,
            });
        }
    }

    onSelectAllCheckboxValueChanged() {
        const selectedUsers = this.state.selectedUsers;
        const isAllSelected = selectedUsers.isAllUsersSelected();
        const newSelectedUsers = isAllSelected ? selectedUsers.selectNone() : selectedUsers.selectAll();
        this.updateSelectedUsersForHighlighters(newSelectedUsers);

        this.setState({
            selectedUsers: newSelectedUsers,
        }, this.emitUserSelectionUpdate);
    }

    onIdentityCheckboxValueChanged(identifier) {
        const newSelectedUsers = this.state.selectedUsers.toggleSelection(identifier);
        this.updateSelectedUsersForHighlighters(newSelectedUsers);

        this.setState({
            selectedUsers: newSelectedUsers,
        }, this.emitUserSelectionUpdate);
    }

    updateSelectedUsersForHighlighters(selectedUsers) {
        Object.keys(this.state.columnMetadata).forEach(function(columnName) {
            const metadata = this.state.columnMetadata[columnName];
            if (metadata.highlighter) {
                metadata.highlighter.setSelectedUsers(selectedUsers);
            }
        }.bind(this));
    }

    emitUserSelectionUpdate() {
        if (this.props.onUserSelectionChanged) {
            this.props.onUserSelectionChanged(this.state.selectedUsers);
        }
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
        const isUserSelected = this.state.selectedUsers.isUserSelected(overviewRecord.identifier);

        const selectionStyle = {
            color: isUserSelected ? '' : OverviewSummaryTable.COLOR_UNSELECTED
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
            <SimpleSortableTable
                columnMetadata={this.state.columnMetadata}
                rowData={this.props.overviewUserdata}
                rowRenderer={this.renderRow.bind(this)} />
        );
    }
}

OverviewSummaryTable.displayName = 'OverviewSummaryTable';

OverviewSummaryTable.defaultProps = {
    datasetOverview: {},
    overviewUserdata: [],
    onUserSelectionChanged: null
};

OverviewSummaryTable.propTypes = {
    datasetOverview: React.PropTypes.object,
    overviewUserdata: React.PropTypes.array,
    selectedUsers: React.PropTypes.instanceOf(SelectedUsers).isRequired,
    onUserSelectionChanged: React.PropTypes.func
};

OverviewSummaryTable.COLOR_UNSELECTED = '#cccccc';
