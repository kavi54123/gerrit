import 'bootstrap/dist/css/bootstrap.css';
import './style/base.scss';

import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import {Router, Route, hashHistory} from 'react-router';

import GlobalJavascriptLoader from './common/loader/GlobalJavascriptLoader';
import ProjectsTable from './overview/ProjectsTable';
import CommitsTable from './overview/CommitsTable';

var jsLoader = new GlobalJavascriptLoader();

function onProjectLevelStatsLoaded() {
    renderPage();
}

jsLoader.loadJavascriptFile('./data/project-level-stats.js', onProjectLevelStatsLoaded);

// Called when preconditions are complete (data is loaded).
function renderPage() {
    ReactDOM.render(
        <div>
            <Router history={hashHistory}>
                <Route path='/' component={ProjectsTable}
                    overviewProjectsData={window.projectLevelStats}
                />
                <Route path='/commits/:projectName' component={CommitsTable}
                    overviewProjectsData={window.projectLevelStats}
                />
            </Router>
        </div>,
        document.getElementById('app')
    );
}
