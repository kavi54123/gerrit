import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { loggedUser } from '../reducers/user'
import { withRouter, Link } from 'react-router-dom'
import { baseurl } from '../api'

class LoginView extends React.Component {
  render() {
    return (
      <a className="nav-link" href={baseurl + '/login'}>
        Sign in with GitHub
      </a>
    )
  }
}

const UserViewMapStateToProps = (state) => {
  return {
    logged_user_loading: state.LoggedUserReducer.logged_user_loading,
    logged_user_result: state.LoggedUserReducer.logged_user_result,
    logged_user_error: state.LoggedUserReducer.logged_user_error
  }
}

const UserViewDispatchToProps = (dispatch) => {
  return {
    getLoggedUser: () => dispatch(loggedUser())
  }
}

class UserView extends React.Component {
  componentDidMount() {
    this.props.getLoggedUser()
  }

  render() {
    if (this.props.logged_user_loading) {
      return ''
    } else if (
      !this.props.logged_user_loading &&
      this.props.logged_user_error
    ) {
      // Probably authentication is not configured
      return ''
    } else if (
      !this.props.logged_user_loading &&
      this.props.logged_user_result
    ) {
      return (
        <Link className="nav-link" to="/">
          Hello {this.props.logged_user_result}
        </Link>
      )
    } else {
      // Authentication is activated but endpoint returned null meaning
      // there is not active user session
      return <LoginView />
    }
  }
}

UserView.propTypes = {
  logged_user_loading: PropTypes.bool,
  logged_user_result: PropTypes.string,
  logged_user_error: PropTypes.bool,
  getLoggedUser: PropTypes.func
}

const CUserView = withRouter(
  connect(UserViewMapStateToProps, UserViewDispatchToProps)(UserView)
)

export { CUserView, LoginView }
