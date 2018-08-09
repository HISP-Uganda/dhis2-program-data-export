import React from 'react';
import ReactDOM from 'react-dom';
import {init} from 'd2/lib/d2';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

// const baseUrl = 'http://localhost:8080/dhis';
// const baseUrl = 'https://cbs-academy.dhis2.org/demo';

let baseUrl = '';
if (process.env.NODE_ENV === 'development') {
    baseUrl = 'http://localhost:8080/dhis/api/29';
} else {
    let urlArray = window.location.pathname.split('/');
    let apiIndex = urlArray.indexOf('api');
    if (apiIndex > 1) {
        baseUrl = '/' + urlArray[apiIndex - 1] + '/api/29';
    } else {
        baseUrl = '/api/29';
    }
}

init({
    baseUrl
}).then(d2 => {
    ReactDOM.render(
        <App d2={d2} baseUrl={baseUrl}/>, document.getElementById('root'));
    registerServiceWorker();
}).catch(e => console.error);
