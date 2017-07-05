'use strict'
import React from 'react'
import { Route, IndexRedirect, IndexRoute, Link } from 'react-router'
import { PanelGroup, Panel } from 'react-bootstrap'

import Signup from 'APP/app/components/Signup'
import Lobby from './components/Lobby'
import RulePage from './components/Rulepage'
import GamePageWrapper from './GamePageWrapper'

const HomePage = ({ children }) => <div className='homepage-background'>
  <Panel header="Sign up" ><Signup /></Panel>
</div>

export default <Route path="/home" component={({ children }) => children}>
  <IndexRoute component={HomePage} />
  <Route path='/lobby' component={Lobby} />
  <Route path='/rules' component={RulePage} />
  <Route path='/game/:id' component={GamePageWrapper} />
</Route>
