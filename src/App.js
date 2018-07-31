import React, {Component} from 'react';
import './App.css';
import 'react-select/dist/react-select.css';

import {Provider} from "mobx-react";
import PropTypes from 'prop-types';
import IntegrationStore from './stores/IntegrationStore'
import Program from './programs/program';

import D2UIApp from '@dhis2/d2-ui-app';

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            d2: props.d2,
        };
    }

    getChildContext() {
        return {d2: this.state.d2};
    }

    render() {
        return (
            <Provider IntegrationStore={IntegrationStore}>
                <D2UIApp>
                    <Program d2={this.state.d2}/>
                </D2UIApp>
            </Provider>
        );
    }
}

App.childContextTypes = {
    d2: PropTypes.object,
};

App.propTypes = {
    d2: PropTypes.object.isRequired,
};

export default App;
