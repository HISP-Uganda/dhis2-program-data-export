import React from 'react';
import '@dhis2/d2-ui-core/build/css/Table.css';
import LinearProgress from '@material-ui/core/LinearProgress';
import {inject, observer} from "mobx-react";
import Select from 'react-select';
import {InputField, PeriodPicker, Tab, Tabs} from '@dhis2/d2-ui-core';
import {GroupEditor} from '@dhis2/d2-ui-group-editor';
import {withStyles} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExportTable from './exportTable';

import PropTypes from 'prop-types';


// import Table from '@dhis2/d2-ui-table';


const styles = theme => ({
    root: {
        flexGrow: 1,
    },

    card: {
        margin: '5px'
    },
    button: {
        marginRight: theme.spacing.unit,
    },
    instructions: {
        marginTop: theme.spacing.unit,
        marginBottom: theme.spacing.unit,
    },
    space: {
        marginLeft: '5px;'
    },
    table: {
        width: '100%',
    },
    hidden: {
        display: 'none'
    },
    block: {
        display: 'block'
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: '33.33%',
        flexShrink: 0,
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
});

const stylesx = {
    div: {
        display: 'flex',
        flexDirection: 'row wrap',
        // padding: 20,
        width: '100%'
    },
    paperLeft: {
        flex: 1,
        height: '100%',
        // margin: 10,
        // textAlign: 'center',
        padding: 5
    },
    paperRight: {
        height: 800,
        flex: 1.6,
        padding: 5,
        overflow: 'scroll'
        // textAlign: 'center',
    }
};

@inject('IntegrationStore')
@observer
class Program extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const {d2, IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
        this.integrationStore.setD2(d2);
        this.integrationStore.fetchPrograms();
        this.integrationStore.fetchAllSqlView();

        d2.i18n.translations['assign_all'] = 'Assign all';
        d2.i18n.translations['hidden_by_filters'] = 'Hidden by filters';
        d2.i18n.translations['day'] = 'Day';

    }

    render() {
        const {classes, d2} = this.props;
        let progress = '';
        if (this.integrationStore.loading) {
            progress = <LinearProgress variant="indeterminate"/>;
        }
        return (
            <div>
                {progress}
                <div style={stylesx.div}>
                    <div zdepth={3} style={stylesx.paperLeft}>
                        <Select
                            placeholder="Select one"
                            value={this.integrationStore.program}
                            options={this.integrationStore.programs}
                            labelKey="displayName"
                            onChange={this.integrationStore.handleChange}
                        />
                        <br/>
                        <ExpansionPanel expanded={this.integrationStore.expanded === 'panel1'}
                                        onChange={this.integrationStore.handlePanelChange('panel1')}>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                <Typography className={classes.heading}>Elements & Attributes</Typography>
                                <Typography className={classes.secondaryHeading}>Select Data Elements &
                                    Attributes</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails className={classes.block}>
                                <Tabs>
                                    <Tab label='Attributes'>
                                        <InputField
                                            id="filter"
                                            label="Filter"
                                            type="text"
                                            fullWidth
                                            value={this.integrationStore.filterText}
                                            onChange={(value) => this.integrationStore.filterChange(value)}
                                        />
                                        <GroupEditor
                                            itemStore={this.integrationStore.itemStore}
                                            assignedItemStore={this.integrationStore.assignedItemStore}
                                            onAssignItems={this.integrationStore.assignItems}
                                            onRemoveItems={this.integrationStore.unAssignItems}
                                            height={150}
                                            filterText={this.integrationStore.filterText}
                                        />
                                    </Tab>
                                    <Tab label='Data Elements'>
                                        <br/>
                                        <Select
                                            placeholder="Select one"
                                            value={this.integrationStore.selectedStage}
                                            options={this.integrationStore.programStages}
                                            labelKey="displayName"
                                            onChange={this.integrationStore.handleStageChange}
                                        />

                                        <InputField
                                            id="filter"
                                            label="Filter"
                                            type="text"
                                            fullWidth
                                            value={this.integrationStore.dataElementFilterText}
                                            onChange={(value) => this.integrationStore.dataElementFilterChange(value)}
                                        />

                                        <GroupEditor
                                            itemStore={this.integrationStore.dataElementStore}
                                            assignedItemStore={this.integrationStore.assignedDataElementStore}
                                            onAssignItems={this.integrationStore.assignDataElements}
                                            onRemoveItems={this.integrationStore.unAssignDataElements}
                                            height={150}
                                            filterText={this.integrationStore.dataElementFilterText}
                                        />
                                    </Tab>

                                    <Tab label='Other Columns'>
                                        <InputField
                                            id="filter"
                                            label="Filter"
                                            type="text"
                                            fullWidth
                                            value={this.integrationStore.filterOtherText}
                                            onChange={(value) => this.integrationStore.otherFilterChange(value)}
                                        />
                                        <GroupEditor
                                            itemStore={this.integrationStore.otherColumnStore}
                                            assignedItemStore={this.integrationStore.assignedOtherColumnStore}
                                            onAssignItems={this.integrationStore.assignOtherColumns}
                                            onRemoveItems={this.integrationStore.unAssignOtherColumns}
                                            height={150}
                                            filterText={this.integrationStore.filterOtherText}
                                        />
                                    </Tab>
                                </Tabs>
                                <br/>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                        {/*<ExpansionPanel expanded={this.integrationStore.expanded === 'panel2'}
                                        onChange={this.integrationStore.handlePanelChange('panel2')}>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                <Typography className={classes.heading}>Organisation Units</Typography>
                                <Typography className={classes.secondaryHeading}>
                                    Filter by organisation units
                                </Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails className={classes.block}>
                                <ExportOrgUnitTree d2={d2}/>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>*/}

                        <ExpansionPanel expanded={this.integrationStore.expanded === 'panel3'}
                                        onChange={this.integrationStore.handlePanelChange('panel3')}>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                <Typography className={classes.heading}>Period</Typography>
                                <Typography className={classes.secondaryHeading}>
                                    Filter by periods
                                </Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails className={classes.block}>
                                <Select
                                    value={this.integrationStore.periodType}
                                    options={this.integrationStore.periods}
                                    onChange={this.integrationStore.changePeriodType}
                                />
                                <PeriodPicker
                                    periodType={this.integrationStore.periodType}
                                    onPickPeriod={(value) => this.integrationStore.pick(value)}
                                />
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    </div>
                    <div zdepth={3} style={stylesx.paperRight}>
                        <Button
                            disabled={!this.integrationStore.canUpdate}
                            variant="contained"
                            color="primary"
                            onClick={this.integrationStore.fetchData}>
                            Update
                        </Button>
                        &nbsp;
                        <Button
                            disabled={!this.integrationStore.canDownload}
                            variant="contained"
                            color="primary"
                            onClick={this.integrationStore.downloadData}>
                            Download
                        </Button>
                        <ExportTable/>
                    </div>
                </div>
            </div>
        );
    }
}

Program.propTypes = {
    d2: PropTypes.object.isRequired,
    classes: PropTypes.object,
};

export default withStyles(styles)(Program);
