import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, Row, Col, Panel, Button } from 'react-bootstrap';
import CommunityForm from './CommunityForm';
import { connect } from 'react-redux'
import { loadCommunity, loadAccountsFor } from '../store/data/actions'

class Community extends React.Component {
  
  componentDidMount() {
    const communityId = this.props.match.params.id;
    this.props.loadCommunity(communityId);
    this.props.loadAccountsFor(communityId);
    this.setState({editing: false});
  }

  toggleEditing = () => {
    if (!this.props.user.isAdmin) return;
    this.setState({editing: this.state.editing ? false : true});
  }

  render() {
    if ((this.props.community === undefined || this.props.accounts === undefined) && this.props.user === undefined) {
      return (
        <div>Loading...</div>
      );
    }
    if (this.props.community.metadata === undefined) {
      return (
        <div>Server error...</div>
      );
    }
    if (this.state && this.state.editing) {
      return (
        <CommunityForm community = {this.props.community} />
      );
    }

    return (
      <Grid>
        <Row>
          <Col md={12}>
            <Panel>
              <Panel.Heading>
                {this.props.community.metadata.name}
                {this.props.user.isAdmin && <Button bsStyle="link" onClick={this.toggleEditing}>edit</Button>}
                &nbsp;
                {this.props.accounts.length} members
              </Panel.Heading>
              <Panel.Body>
                <Row>
                  {this.props.community.metadata.description}
                </Row>
                {this.props.accounts.map(account =>
                  <Row key={account.id}>
                    <Link to={`/account/${account.id}`}>{account.metadata.name || account.metadata.email}</Link>
                  </Row>
                )}
              </Panel.Body>
            </Panel>
          </Col>
        </Row>
      </Grid>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    editing: state.editing,
    user: state.user,
    community: state.community,
    accounts: state.accounts,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    loadCommunity: (communityId) => dispatch(loadCommunity(communityId)),
    loadAccountsFor: (communityId) => dispatch(loadAccountsFor(communityId)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Community);
