import React from 'react';
import '@dhis2/d2-ui-core/build/css/Table.css';
import {inject, observer} from "mobx-react";
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import {OrgUnitTree} from '@dhis2/d2-ui-org-unit-tree';

import {OrgUnitSelectAll, OrgUnitSelectByGroup, OrgUnitSelectByLevel} from '@dhis2/d2-ui-org-unit-select';


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
});

@inject('IntegrationStore')
@observer
class ExportOrgUnitTree extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const {d2, IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
        this.integrationStore.getOrganisationUnits();

        d2.i18n.translations['select'] = 'select';
        d2.i18n.translations['deselect'] = 'deselect';

        d2.i18n.translations['select_all'] = 'Select All';
        d2.i18n.translations['deselect_all'] = 'Deselect All';

        d2.i18n.translations['organisation_unit_level'] = 'Level';
        d2.i18n.translations['organisation_unit_group'] = 'Group';
        d2.i18n.translations['year'] = 'Year';
        d2.i18n.translations['sixMonth'] = 'Six Month';
        d2.i18n.translations['jan-jun'] = 'Jan - Jun';
        d2.i18n.translations['jul-dec'] = 'Jul - Dec';
    }

    render() {

        let tree = '';
        if (this.integrationStore.rootWithMembers) {
            tree = <div>

                <table width="100%">
                    <tbody>
                    <tr>
                        <td width="100%" valign="top">
                            <OrgUnitTree
                                root={this.integrationStore.rootWithMembers}
                                selected={this.integrationStore.selected}
                                currentRoot={this.integrationStore.currentRoot}
                                // initiallyExpanded={[`/${this.integrationStore.rootWithMembers.id}`]}
                                onSelectClick={this.integrationStore.handleOrgUnitClick}
                                onChangeCurrentRoot={this.integrationStore.changeRoot}
                                memberCollection="dataSets"
                                memberObject="TuL8IOPzpHh"
                                onChildrenLoaded={this.integrationStore.handleChildrenLoaded}
                            />
                            <br/>
                            <br/>
                        </td>

                    </tr>
                    <tr>
                        <td width="100%" valign="top">
                            <div>
                                {this.integrationStore.currentRoot ? (
                                    <div>For organisation units within <span style={styles.ouLabel}>{
                                        this.integrationStore.currentRoot.displayName
                                    }</span>:</div>
                                ) : <div>For all organisation units:</div>}
                                <div style={{marginBottom: -24, marginTop: -16}}>
                                    <OrgUnitSelectByLevel
                                        levels={this.integrationStore.levels}
                                        selected={this.integrationStore.selected}
                                        currentRoot={this.integrationStore.currentRoot}
                                        onUpdateSelection={this.integrationStore.handleSelectionUpdate}
                                    />
                                </div>
                                <div>
                                    <OrgUnitSelectByGroup
                                        groups={this.integrationStore.groups}
                                        selected={this.integrationStore.selected}
                                        currentRoot={this.integrationStore.currentRoot}
                                        onUpdateSelection={this.integrationStore.handleSelectionUpdate}
                                    />
                                </div>
                                <div style={{float: 'right'}}>
                                    <OrgUnitSelectAll
                                        selected={this.integrationStore.selected}
                                        currentRoot={this.integrationStore.currentRoot}
                                        onUpdateSelection={this.integrationStore.handleSelectionUpdate}
                                    />
                                </div>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        }
        return <div>
            {tree}
        </div>
    }
}

ExportOrgUnitTree.propTypes = {
    d2: PropTypes.object.isRequired,
    classes: PropTypes.object,
};

export default withStyles(styles)(ExportOrgUnitTree);
