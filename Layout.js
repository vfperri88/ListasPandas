import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Switch, Route, withRouter, Redirect } from "react-router";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Hammer from "rc-hammerjs";

import Dashboard from "../../pages/dashboard";
import Header from "../Header";
import Sidebar from "../Sidebar";
import {
  openSidebar,
  closeSidebar,
  toggleSidebar,
} from "../../actions/navigation";
import s from "./Layout.module.scss";
import BreadcrumbHistory from "../BreadcrumbHistory";

// pages
import Typography from "../../pages/typography";
import Maps from "../../pages/maps";
import Notifications from "../../pages/notifications/Notifications";
import Icons from "../../pages/icons";
import Tables from "../../pages/tables";
import ReactFlagsSelect from 'react-flags-select';
import cookies from 'js-cookie';
import {setLanguage} from 'redux-i18n';
import Modules from "../../pages/modules/Modules";
import Module from "../../pages/modules/Module";
import Result from "../../pages/modules/Result";


import EditUser from "../../pages/users/EditUser";

import Charts from "../../pages/charts";

class Layout extends React.Component {
  static propTypes = {
    sidebarStatic: PropTypes.bool,
    sidebarOpened: PropTypes.bool,
    dispatch: PropTypes.func.isRequired,
  };

  static defaultProps = {
    sidebarStatic: true,
    sidebarOpened: true,
  };

  constructor(props) {
    super(props);
    var countries= ["ES", "GB"];
    var customLabels= {"ES": "ES","GB": "EN"};

    this.state = {
      lang: cookies.get('i18lang') || 'ES',
      countries: countries,
      customLabels: customLabels,
      mounted: false 
    };


    this.handleSwipe = this.handleSwipe.bind(this);
    this.handleCloseSidebar = this.handleCloseSidebar.bind(this);
  }

  setCountryCode(code) {
    cookies.set('i18lang', code);
    this.props.dispatch(setLanguage(code))
  }

  componentDidMount() {
    this.setState({ mounted: true });
    this.handleResize();
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  componentWillUnmount() {
    this.setState({ mounted: false });
    window.removeEventListener("resize", this.handleResize.bind(this));
  }

  handleResize() {
    if (window.innerWidth <= 768) {
      this.props.dispatch(toggleSidebar());
    } else if (window.innerWidth >= 768) {
      this.props.dispatch(openSidebar());
    }
  }

  handleCloseSidebar(e) {
    if (e.target.closest("#sidebar-drawer") == null && this.props.sidebarOpened && window.innerWidth <= 768) {
      this.props.dispatch(toggleSidebar());
    }
  }

  handleSwipe(e) {
    if ("ontouchstart" in window) {
      if (e.direction === 4) {
        this.props.dispatch(openSidebar());
        return;
      }

      if (e.direction === 2 && this.props.sidebarOpened) {
        this.props.dispatch(closeSidebar());
        return;
      }
    }
  }

  render() {
    return (

    <div>

          <Header />
          <div  style={{margin: "21px 0px 0px 40px",width: "300px"}}>
              <ReactFlagsSelect
                  selected={this.props.lang}
                  countries={this.state.countries}
                  onSelect={code => this.setCountryCode(code)}
                  customLabels={this.state.customLabels}
                  placeholder={this.context.t('lang.select')} required/>
          </div>
          <div>
          <Hammer onSwipe={this.handleSwipe}>
            <main className={s.content}>
              <TransitionGroup>
                <CSSTransition
                  key={this.props.location.key}
                  classNames="fade"
                  timeout={200}
                >
                  <Switch>
                    <Route
                        path="/app/main"
                        exact
                        render={() => <Redirect to="/app/modules" />}
                    />
                    <Route
                      exact path='/app/modules' component={
                        (props) => <Modules lang={this.props.lang}/>
                    } />
                    <Route
                      exact path='/app/map' component={
                        (props) => <Maps lang={this.props.lang}/>
                    } />
                    <Route exact path='/app/modules/:id' component={
                      (props) => <Module id={props.match.params.id}/>
                    } />
                    <Route exact path='/app/results/:id' component={
                      (props) => <Result id={props.match.params.id}/>
                    } />
                    <Route
                      path="/app/main/dashboard"
                      exact
                      component={Dashboard}
                    />
                    <Route exact path='/app/edit-user/:id' component={
                      (props) => <EditUser id={props.match.params.id}/>
                    } />
                    <Route exact path="/app/modules" component={Modules} />
                  </Switch>
                </CSSTransition>
              </TransitionGroup>
            </main>
          </Hammer>
          </div>

        </div>
    );
  }
}


Layout.contextTypes = {
  t: PropTypes.func.isRequired
}

function mapStateToProps(store) {
  return {
    sidebarOpened: store.navigation.sidebarOpened,
    sidebarStatic: store.navigation.sidebarStatic,
    lang: store.i18nState.lang
  };
}

export default withRouter(connect(mapStateToProps)(Layout));
