import React from 'react';
import '@dhis2/d2-ui-core/build/css/Table.css';
import {inject, observer} from "mobx-react";
import {withStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TablePagination from "@material-ui/core/TablePagination";

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
class ExportTable extends React.Component {
    integrationStore = null;

    constructor(props) {
        super(props);
        const {IntegrationStore} = props;
        this.integrationStore = IntegrationStore;
    }

    render() {

        let table = '';
        if (this.integrationStore.headers.length > 0) {
            table = <div>
                <Table>
                    <TableHead>
                        <TableRow>{this.integrationStore.headers.map((s, k) => {
                            return <TableCell key={k}>{this.integrationStore.allColumns[s.column]}</TableCell>
                        })}</TableRow>
                    </TableHead>

                    <TableBody>
                        {this.integrationStore.rows.map((s, y) => {
                            return (
                                <TableRow key={y} hover>
                                    {
                                        this.integrationStore.headers.map((c, k) => {
                                            return <TableCell key={k}>{s[k]}</TableCell>
                                        })
                                    }
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={this.integrationStore.pageCount}
                    rowsPerPage={this.integrationStore.rowsPerPage}
                    page={this.integrationStore.page}
                    backIconButtonProps={{
                        'aria-label': 'Previous Page',
                    }}
                    nextIconButtonProps={{
                        'aria-label': 'Next Page',
                    }}
                    onChangePage={this.integrationStore.handleChangePage}
                    onChangeRowsPerPage={this.integrationStore.handleChangeRowsPerPage}
                />
            </div>;
        }
        return <div>
            {table}
        </div>
    }
}

ExportTable.propTypes = {
    classes: PropTypes.object,
};

export default withStyles(styles)(ExportTable);
