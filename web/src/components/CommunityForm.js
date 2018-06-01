import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Grid, Row, Col, Panel, FormControl, Button, Alert } from 'react-bootstrap';

class CommunityForm extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.state = {
      id: 0,
      adminAddress: '',
      isClosed: false,
      domain: '',
      metadata: {},
      tags: [],
      accounts: [],
    };
  }

  handleNameChange(e) {
    this.setState({ metadata: {'name':e.target.name} });
  }

  submitForm = async (event) => {
    event.preventDefault();
    console.log("Submitting form");
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <Panel>
              <Panel.Heading>
                New Community
              </Panel.Heading>
              <Panel.Body>
                <form onSubmit={this.submitForm}>
                  <Row>
                    <FormControl type="text" value={this.state.name} placeholder="Enter community name" onChange={this.handleNameChange} />
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

export default CommunityForm;