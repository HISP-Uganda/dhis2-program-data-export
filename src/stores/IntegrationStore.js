import * as mobx from 'mobx';
import {action, computed, observable} from 'mobx';
import _ from 'lodash';
import XLSX from 'xlsx';
import {Store} from '@dhis2/d2-ui-core';
import {generateUid} from 'd2/lib/uid';

import {decrementMemberCount, incrementMemberCount, mergeChildren} from '@dhis2/d2-ui-org-unit-tree';

mobx.configure({enforceActions: true});

const otherColumns = [{
    text: 'ou',
    value: 'ou'
}, {
    text: 'ou name',
    value: 'ouname'
}, {
    text: 'ou code',
    value: 'oucode'
}, {
    text: 'enrollment date',
    value: 'enrollmentdate'
}, {
    text: 'execution date',
    value: 'executiontdate'
}, {
    text: 'due date',
    value: 'duedate'
}, {
    text: 'incident date',
    value: 'incidentdate'
}, {
    text: 'program stage',
    value: 'ps'
}];

class IntegrationStore {

    @observable itemStore = Store.create();
    @observable assignedItemStore = Store.create();

    @observable dataElementStore = Store.create();
    @observable assignedDataElementStore = {};

    @observable otherColumnStore = Store.create();
    @observable assignedOtherColumnStore = Store.create();

    @observable programs = [];
    @observable d2 = {};
    @observable error = '';
    @observable loading = false;
    @observable multipleCma = {};
    @observable program = null;
    @observable selectedStage = null;
    @observable pages = 1;
    @observable percentage = 0;
    @observable increment = 0;
    @observable events = [];
    @observable sqlViews = {};
    @observable currentEntity;
    @observable data = [];
    @observable headers = [];
    @observable rows = [];
    @observable values = [];
    @observable periodType = 'Daily';
    @observable filterText;
    @observable filterOtherText;
    @observable levels;
    @observable selected;
    @observable rootWithMembers;
    @observable groups;
    @observable dataElementFilterText;
    @observable currentRoot;
    @observable sqlViewUpdated = false;
    @action setD2 = (d2) => {
        this.d2 = d2;
    };

    allColumns = {};

    @observable periods = [
        {label: 'Daily', value: 'Daily'},
        {label: 'Weekly', value: 'Weekly'},
        {label: 'WeeklyWednesday', value: 'WeeklyWednesday'},
        {label: 'WeeklyThursday', value: 'WeeklyThursday'},
        {label: 'WeeklySaturday', value: 'WeeklySaturday'},
        {label: 'WeeklySunday', value: 'WeeklySunday'},
        {label: 'Monthly', value: 'Monthly'},
        {label: 'BiMonthly', value: 'BiMonthly'},
        {label: 'Quarterly', value: 'Quarterly'},
        {label: 'SixMonthly', value: 'SixMonthly'},
        {label: 'SixMonthlyApril', value: 'SixMonthlyApril'},
        {label: 'Yearly', value: 'Yearly'},
        {label: 'FinancialApril', value: 'FinancialApril'},
        {label: 'FinancialJuly', value: 'FinancialJuly'},
        {label: 'FinancialOct', value: 'FinancialOct'},
        {label: 'Invalid period type', value: 'Invalid'}
    ];

    @observable pageCount;
    @observable pageSize;
    @observable page;
    @observable rowsPerPage;
    @observable total;
    @observable expanded;
    @observable period;
    @observable selectedAttributes = [];
    @observable selectedElements = {};
    @observable selectedOthers = [];
    @observable downloadLabel = 'Download'

    constructor() {
        this.itemStore.state = [];
        this.assignedItemStore.state = [];
        this.dataElementStore.state = [];
        this.assignedDataElementStore.state = [];
        this.assignedOtherColumnStore.state = [];
        this.otherColumnStore.setState(otherColumns);
    }

    @action
    pick = (val) => {
        this.period = val;
    };


    @action
    filterChange = (e) => {
        this.filterText = e
    };

    @action
    otherFilterChange = (e) => {
        this.filterOtherText = e
    };

    @action
    dataElementFilterChange = (e) => {
        this.dataElementFilterText = e
    };

    @action
    handleChange = (program) => {
        if (program !== null) {
            program.programTrackedEntityAttributes = program.programTrackedEntityAttributes.map(pta => {
                this.allColumns[pta.trackedEntityAttribute.id] = pta.trackedEntityAttribute.displayName;
                return {...pta.trackedEntityAttribute, mandatory: pta.mandatory, valueType: pta.valueType}
            });
            program.programStages = program.programStages.toArray();
            program.organisationUnits = program.organisationUnits.toArray();

            let stores = {};
            let elements = {};

            program.programStages.forEach(stage => {
                const store = Store.create();
                store.state = [];
                stores = {...stores, ..._.fromPairs([[stage.id, store]])};
                elements = {...elements, ..._.fromPairs([[stage.id, []]])}
            });
            this.selectedElements = elements;
            this.assignedDataElementStore = stores;

            const items = program.programTrackedEntityAttributes.map(attribute => {
                return {text: attribute.displayName, value: attribute.id};
            });
            this.selectedStage = null;
            this.itemStore.setState(items);
            this.dataElementStore.setState([]);
            this.assignedOtherColumnStore.setState([]);
            this.rows = [];
            this.headers = [];
            this.program = program;
        } else {
            this.program = null;
            this.selectedStage = null;
            this.itemStore.setState([]);
            this.dataElementStore.setState([]);
            this.assignedOtherColumnStore.setState([]);
            this.rows = [];
            this.headers = [];
        }
    };

    @action
    handleStageChange = (stage) => {
        if (stage !== null) {
            const found = _.find(this.program.programStages, {id: stage.id});
            const items = found.programStageDataElements.map(de => {
                if (this.isTracker) {
                    this.allColumns[stage.id + '_' + de.dataElement.id] = de.dataElement.displayName;
                } else {
                    this.allColumns[de.dataElement.id] = de.dataElement.displayName;
                }
                return {text: de.dataElement.displayName, value: de.dataElement.id};
            });
            this.selectedStage = found;
            this.dataElementStore.setState(items);
        } else {
            this.selectedStage = null;
            this.dataElementStore.setState([]);
        }
    };

    @action
    changePeriodType = (periodType) => {
        if (periodType) {
            this.periodType = periodType.value;
        } else {
            this.periodType = 'Monthly';
        }
        this.values = [];
    };

    @action
    fetchPrograms = () => {
        this.toggleLoading(true);
        this.d2.models.programs.list({
            paging: false,
            fields: 'id,name,displayName,lastUpdated,programType,trackedEntityType,programTrackedEntityAttributes' +
            '[mandatory,valueType,trackedEntityAttribute[id,code,name,displayName,unique,optionSet[options[name,code]]]],' +
            'programStages[id,name,displayName,repeatable,programStageDataElements[compulsory,' +
            'dataElement[id,code,valueType,name,displayName,optionSet[options[name,code]]]]],organisationUnits[id,code,name,path]'
        }).then(action(progarms => {
            this.programs = progarms.toArray();
            this.toggleLoading(false);
        }), action(error => {
            console.log(error)
        }))
    };


    @action getOrganisationUnits = () => {

        Promise.all([
            this.d2.models.organisationUnitLevels.list({
                paging: false,
                fields: 'id,level,displayName',
                order: 'level:asc',
            }),
            this.d2.models.organisationUnitGroups.list({
                paging: false,
                fields: 'id,displayName',
            }),
            /* this.d2.models.organisationUnits.list({
                 paging: false,
                 level: 1,
                 fields: 'id,displayName,path,children::isNotEmpty,memberCount',
                 memberCollection: 'dataSets',
                 memberObject: 'TuL8IOPzpHh',
             }),*/
            this.d2.models.organisationUnits.list({
                paging: false,
                level: 1,
                fields: 'id,displayName,path'
            }),
            /*this.d2.models.dataSets.get('TuL8IOPzpHh', {
                paging: false,
                fields: 'organisationUnits[id,path]',
            }),*/
        ]).then(action(([levels, groups, rootWithDataSetMembers]) => {
            const rootWithMembers = rootWithDataSetMembers.toArray()[0];
            // const selected = dataSetMembers.organisationUnits.toArray().map(ou => ou.path);
            this.levels = levels;
            this.rootWithMembers = rootWithMembers;
            this.selected = [];
            this.groups = groups;
        }));

    };

    @action
    handleSelectionUpdate = (newSelection) => {
        this.selected = newSelection;
    };

    @action
    handleOrgUnitClick = (event, orgUnit) => {
        if (this.selected.includes(orgUnit.path)) {
            this.selected.splice(this.selected.indexOf(orgUnit.path), 1);
            decrementMemberCount(this.rootWithMembers, orgUnit);
            // this.selected = this.state.selected
        } else {
            incrementMemberCount(this.rootWithMembers, orgUnit);
            this.selected = this.selected.concat(orgUnit.path);
        }
    };

    @action
    handleChildrenLoaded = (children) => {
        // function countChildren(root) {
        //     if (root.children && root.children.size && root.children.size > 0) {
        //         return root.children.toArray().reduce((sum, child) => sum + countChildren(child), 1);
        //     }
        //     return 1;
        // }
        this.rootWithMembers = mergeChildren(this.rootWithMembers, children);
    };

    @action
    changeRoot = (currentRoot) => {
        this.currentRoot = currentRoot;
    };


    @action assignItems = (items) => {
        const assigned = this.assignedItemStore.state.concat(items);
        this.assignedItemStore.setState(assigned);
        this.selectedAttributes = assigned;
        return Promise.resolve();
    };

    @action unAssignItems = (items) => {
        const assigned = this.assignedItemStore
            .state
            .filter(item => items.indexOf(item) === -1);
        this.assignedItemStore.setState(assigned);
        this.selectedAttributes = assigned;
        return Promise.resolve();
    };

    @action assignOtherColumns = (items) => {
        const assigned = this.assignedOtherColumnStore.state.concat(items);
        this.assignedOtherColumnStore.setState(assigned);
        this.selectedOthers = assigned;
        return Promise.resolve();
    };

    @action unAssignOtherColumns = (items) => {
        const assigned = this.assignedOtherColumnStore
            .state
            .filter(item => items.indexOf(item) === -1);
        this.assignedOtherColumnStore.setState(assigned);
        this.selectedOthers = assigned;
        return Promise.resolve();
    };

    @action assignDataElements = (items) => {
        const assigned = this.assignedDataElementStore[this.selectedStage.id].state.concat(items);
        this.assignedDataElementStore[this.selectedStage.id].setState(assigned);
        this.selectedElements[this.selectedStage.id] = assigned;
        return Promise.resolve();
    };

    @action unAssignDataElements = (items) => {
        const assigned = this.assignedDataElementStore[this.selectedStage.id]
            .state
            .filter(item => items.indexOf(item) === -1);
        this.assignedDataElementStore[this.selectedStage.id].setState(assigned);
        this.selectedElements[this.selectedStage.id] = assigned;
        return Promise.resolve();
    };

    @computed get dataElements() {
        return this.program.dataElement.map(dataElement => {
            return dataElement;
        });
    }

    @action
    toggleLoading = (val) => {
        this.loading = val;
    };


    @action
    fetchAllSqlView = () => {
        const api = this.d2.Api.getApi();
        return api.get('sqlViews', {}).then(action(views => {
            const {sqlViews} = views;
            this.sqlViews = _.fromPairs(_.map(sqlViews, i => [i.displayName, i.id]))
        }), action(error => {
            console.log(error)
        }));
    };

    @action
    fetchView = (view) => {
        this.toggleLoading(true);
        const api = this.d2.Api.getApi();
        const url = 'sqlViews/' + view + '/data';
        api.get(url, {page: this.page + 1, pageSize: this.rowsPerPage}).then(action(data => {
            const {pager, listGrid} = data;
            const {rows, headers} = listGrid;
            const {pageCount, total} = pager;
            this.pageCount = pageCount;
            this.total = total;
            this.rows = rows;
            this.headers = headers;
            this.toggleLoading(false);
        }), action(error => {
            console.log(error)
        }))
    };

    @action
    fetch = (view, page, pageSize) => {
        this.toggleLoading(true);
        const api = this.d2.Api.getApi();
        const url = 'sqlViews/' + view + '/data';
        api.get(url, {pageSize, page}).then(action(data => {
            const {listGrid} = data;
            const {rows, headers} = listGrid;
            const header = headers.map(h => {
                return this.allColumns[h.column];
            });
            this.download([header, ...rows]);
            this.toggleLoading(false);
        }), action(error => {
            console.log(error)
        }))
    };

    @action.bound
    errorFound(error) {
        console.log(error)
    }

    @action download = (data) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SheetJS");
        XLSX.writeFile(wb, "sheetjs.xlsx");
    };

    @action setExpanded = (expanded) => {
        this.expanded = expanded;
    };


    @action
    handlePanelChange = panel => (event, expanded) => {
        this.setExpanded(expanded ? panel : false);
    };

    @action updateSQLView = (sqlQuery) => {
        const api = this.d2.Api.getApi();
        let view = this.sqlViews['analytics'];
        this.rows = [];
        this.headers = [];
        this.rowsPerPage = 10;
        this.page = 0;
        if (view !== null && view !== undefined && view !== '') {
            api.get('sqlViews/' + view).then(action(sqlView => {
                sqlView = {...sqlView, sqlQuery};
                api.update('sqlViews/' + view, sqlView, {mergeMode: 'REPLACE'}).then(response => {
                    this.fetchView(view);
                }, action(error => {
                    this.error = error;
                }))
            }));
        } else {
            view = generateUid();
            api.post('sqlViews', {
                id: view,
                cacheStrategy: 'NO_CACHE',
                name: 'analytics',
                sqlQuery,
                type: 'QUERY'
            }).then(response => {
                this.fetchView();
            }, action(error => {
                console.log(error);
            }));
        }
    };

    @action
    handleChangePage = (event, page) => {
        this.page = page;
        this.fetchView(this.sqlViews['analytics']);
    };

    @action downloadData = () => {
        const rowSize = (new TextEncoder('utf-8').encode(this.rows[0])).length;
        const rowsToFetchAndDownload = Math.floor((30 * 1024 * 1024) / (4 * rowSize));
        const numberOfPages = Math.ceil(this.total / rowsToFetchAndDownload);
        this.downloadLabel = 'Downloading ' + numberOfPages + ' files';
        for (let i = 1; i <= numberOfPages; i++) {
            this.fetch(this.sqlViews['analytics'], i, rowsToFetchAndDownload);
        }
    };

    @action
    handleChangeRowsPerPage = event => {
        this.rowsPerPage = event.target.value;
        this.fetchView(this.sqlViews['analytics']);
    };

    @action fetchData = () => {
        const {columns, table} = this.query;
        let query = '';
        if (columns !== '' && table !== '') {
            if (this.wherePeriod !== null) {
                query = 'select ' + columns + ' from ' + table + ' where ' + this.wherePeriod;
            } else {

                query = 'select ' + columns + ' from ' + table;
            }
            this.updateSQLView(query);
        }
    };

    @computed get isTracker() {
        return this.program !== null && this.program['programType'] === 'WITH_REGISTRATION';
    }

    @computed get programStages() {
        if (this.program !== null) {
            return this.program.programStages;
        } else {
            return [];
        }
    }

    @computed get wherePeriod() {
        if (this.period) {
            return this.periodType.toLowerCase() + " = '" + this.period + "'";
        } else {
            return null;
        }
    }

    @computed get query() {
        let dataElements = this.selectedElements;
        let attributes = this.selectedAttributes;
        let otherColumns = this.selectedOthers;
        let table = '';
        let columns = '';
        let finalColumns = [];

        const otherColumnString = otherColumns.join(',');
        let attributeString = '';
        let elementsArray = [];

        if (this.isTracker && this.selectedStage !== null) {
            table = 'analytics_enrollment_' + this.program.id;

            attributeString = attributes.map(a => {
                return '"' + a + '"';
            }).join(',');

            _.forOwn(dataElements, (e, s) => {
                if (e.length > 0) {
                    const r = e.map(element => {
                        return '"' + s + '_' + element + '"';
                    }).join(',');
                    elementsArray = [...elementsArray, r];
                }
            });


        } else if (this.program !== null) {
            table = 'analytics_event_' + this.program.id;

            _.forOwn(dataElements, e => {
                if (e.length > 0) {
                    const r = e.map(el => {
                        return '"' + el + '"';
                    }).join(',');
                    elementsArray = [...elementsArray, r];
                }
            });
        }

        if (attributeString !== null && attributeString !== '') {
            finalColumns = [...finalColumns, attributeString];
        }

        if (otherColumnString !== null && otherColumnString !== '') {
            finalColumns = [...finalColumns, otherColumnString];
        }

        if (elementsArray.length > 0) {
            finalColumns = [...finalColumns, elementsArray.join(',')];
        }

        if (finalColumns.length > 0) {
            columns = finalColumns.join(',')
        }

        return {table, columns}
    }

    @computed get canDownload() {
        return this.rows.length > 0;
    }

    @computed get currentDataElementStore() {
        return this.assignedDataElementStore[this.selectedStage.id];
    }

    @computed get canUpdate() {
        return this.program !== null && this.query.columns !== '' && this.query.table !== '';
    }
}

const store = new IntegrationStore();
export default store;