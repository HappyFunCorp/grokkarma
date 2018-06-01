import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Home from './Home';
import Profile from './Profile';
import Login from './Login';
import Admin from './Admin';
import Community from './Community';
import CommunityForm from './CommunityForm';
import Account from './Account';
import AccountForm from './AccountForm';
import Vendor from './Vendor';
import VendorForm from './VendorForm';
import Reward from './Reward';
import RewardForm from './RewardForm';
import Give from './Give';
import Spend from './Spend';

const Main = () => (
  <main>
    <Switch>
      <Route exact path='/' component={Home}/>
      <Route exact path='/login' component={Login}/>
      <Route exact path='/profile' component={Profile}/>
      <Route exact path='/admin' component={Admin}/>
      <Route exact path='/admin/community/new' component={CommunityForm}/>
      <Route exact path='/admin/community/:id' component={Community}/>
      <Route exact path='/community' component={Community}/>
      <Route exact path='/community/account/new' component={AccountForm}/>
      <Route exact path='/community/account/:id' component={Account}/>
      <Route exact path='/community/vendor/new' component={VendorForm}/>
      <Route exact path='/community/vendor/:id' component={Vendor}/>
      <Route exact path='/vendor' component={Vendor}/>
      <Route exact path='/vendor/reward/new' component={RewardForm}/>
      <Route exact path='/vendor/reward/:id' component={Reward}/>
      <Route exact path='/user' component={Account}/>
      <Route exact path='/user/give' component={Give}/>
      <Route exact path='/user/reward/:id' component={Spend}/>
    </Switch>
  </main>
)

export default Main