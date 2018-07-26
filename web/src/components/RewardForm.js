import React from 'react';
import { Grid, Row, Col, Panel, Button } from 'react-bootstrap';
import { withRouter } from 'react-router'
import { connect } from 'react-redux'
import { Field, reduxForm } from 'redux-form';

class RewardForm extends React.Component {

  submitForm = async (values) => {
    var body = JSON.stringify({
      reward: {
        id: values.id,
        cost: parseInt(values.cost, 10),
        quantity: parseInt(values.quantity, 10 ),
        tag: values.tag,
        metadata: {
          name: values.name,
          description: values.description,
        },
      }
    });
    console.log("submitting", body);

    var res = await fetch(values.id===0 ? '/api/rewards/create' : '/api/rewards/update', {
      method: values.id===0 ? 'POST' : 'PUT',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body,
    });
    
    if (!res.ok) {
      alert("Server error!");
    } else {
      var json = await res.json();
      if (json.success) {
        values.id===0 ? window.location.reload() : this.props.history.push('/user/rewards');
      } else {
        alert("Server failure! " + JSON.stringify(json));
      }
    }
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <Panel>
              <Panel.Heading>
                New Reward
              </Panel.Heading>
              <Panel.Body>
                <form onSubmit={this.props.handleSubmit(this.submitForm)}>
                  <Row>
                    <label htmlFor="name">Name</label>
                    <Field name="name" component="input" type="text"/>
                  </Row>
                  <Row>
                    <label htmlFor="description">Description</label>
                    <Field name="description" component="input" type="textarea"/>
                  </Row>
                  <Row>
                    <label htmlFor="cost">Cost</label>
                    <Field name="cost" component="input" type="text"/>
                  </Row>
                  <Row>
                    <label htmlFor="quantity">Quantity</label>
                    <Field name="quantity" component="input" type="text"/>
                  </Row>
                  <Row>
                    <label htmlFor="tag">Tag</label>
                    <Field name="tag" component="input" type="text"/>
                  </Row>
                  <Row>
                    <Button type="submit">Submit</Button>
                  </Row>
                </form>
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
    initialValues: ownProps.reward ?{
      id: ownProps.reward.id || 0,
      name: ownProps.reward.metadata ? ownProps.reward.metadata.name : '',
      description: ownProps.reward.metadata ? ownProps.reward.metadata.description : '',
      cost: ownProps.reward.cost,
      quantity: ownProps.reward.quantity,
      tag: ownProps.reward.tag
    } : {
      id: state.reward.id || 0,
      name: state.reward.metadata ? state.reward.metadata.name : '',
      description: state.reward.metadata ? state.reward.metadata.description : '',
      cost: state.reward.cost,
      quantity: state.reward.quantity,
      tag: state.reward.tag
    }
  };
}

RewardForm = reduxForm({
  form: 'account',
})(RewardForm);

RewardForm = connect(mapStateToProps, null)(RewardForm);

export default withRouter(RewardForm);