import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Row,
  Col,
  Table,
  Card,
  Alert,
  Progress,
  Button,
  UncontrolledButtonDropdown,
  DropdownMenu,
  DropdownToggle,
  DropdownItem,
  Input,
  Label,
  Badge,
  Spinner,
  Form,
  Modal
} from 'react-bootstrap'
import { Sparklines, SparklinesBars } from "react-sparklines";
import ModuleDataService from "../../services/ModuleService";
import CategoriesDataService from "../../services/CategoriesService";
import QuestionnaireDataService from "../../services/QuestionnaireService";
import FileUploadDataService from "../../services/FileUploadService";

import ReactFlagsSelect from 'react-flags-select';

import { Redirect } from 'react-router-dom'


import { BsPencilSquare as EditIcon, BsSearch as SearchIcon, BsFillPlayBtnFill as PlayIcon } from "react-icons/bs";
import { FaPlusCircle as AddIcon, FaTrashAlt as TrashIcon, FaAngleDown as DownIcon, FaAngleUp as UpIcon } from "react-icons/fa";

import Widget from "../../components/Widget";
import s from "./Tables.modules.scss";
import Moment from 'moment';
import DataTable from 'datatables.net';
import 'datatables.net-responsive';
import $ from 'jquery'
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import RangeSlider from 'react-bootstrap-range-slider';


class Module extends Component {
  constructor(props) {
    super(props);
    this.retrieveModule = this.retrieveModule.bind(this);
    this.retrieveQuestionnaires = this.retrieveQuestionnaires.bind(this);
    this.retrieveFiles = this.retrieveFiles.bind(this);


    this.state = {
      currentModule: null,
      authenticated: true,
      questionnaire: null,
      step: 1,
      modalFileOpen: false,
      loadingFiles: true,
      countryCode: "ES",
      goToResults: false,
      files: null,
      file: null,
      error: null,
      selectedFile: null,
      countries: null,
      customLabels: null,
      loading: true
    };
  }

  onFileChange = event => {
    this.setState({ selectedFile: event.target.files[0] });
  };

  handleClose(reason) {
    if (reason && reason == "backdropClick") return;
    this.setState({
      open: false
    })
    localStorage.removeItem("id_token");
    window.location.reload();
  }

  handleCloseFile(reason) {
    if (reason && reason == "backdropClick") return;
    this.setState({
      modalFileOpen: false
    })
  }

  handleOpenFile = () => {

    this.retrieveFile();
    this.setState({
      loading: true
    });
  }

  componentDidMount() {
    this.retrieveModule();
    this.retrieveFiles();
  }


  retrieveFile() {

    var files = this.state.files;
    var videos = files.filter(function (el) { return el.type == "video"; });
    var subtitles = files.filter(function (el) { return el.type == "subtitle"; });

    var video = videos[videos.length - 1];
    var subtitle = subtitles[subtitles.length - 1];

    if (subtitle) {
      this.showVideoWithSubtitle(subtitle.id, video.id);
    } else {
      this.showVideo(video.id);
    }

  }

  showVideoWithSubtitle(idSub, idVideo) {

    var self = this;

    FileUploadDataService.get(idSub)
      .then(response => {

        this.setState({
          subtitle: response.data
        });

        self.showVideo(idVideo);
      })
      .catch(e => {
        if (e.response != null && e.response.status != null && e.response.status === 403) {
          console.log('unauthorized, logging out ...');
          this.setState({
            open: true,
            authenticated: false,
            loading: false
          })
        }
      });
  }

  showVideo(idVideo) {

    FileUploadDataService.get(idVideo)
      .then(response => {

        this.setState({
          video: response.data,
          modalFileOpen: true,
          loading: false
        });

      })
      .catch(e => {

        if (e.response != null && e.response.status != null && e.response.status === 403) {
          console.log('unauthorized, logging out ...');
          this.setState({
            open: true,
            authenticated: false,
            loading: false
          })
        }

      });
  }


  retrieveFiles() {

    var id = this.props.id;

    FileUploadDataService.getAll(id, this.props.lang ? this.props.lang : "ES")
      .then(response => {

        this.setState({
          files: response.data,
          loadingFiles: false
        });

      })
      .catch(e => {

        if (e.response != null && e.response.status != null && e.response.status === 403) {
          console.log('unauthorized, logging out ...');
          this.setState({
            open: true,
            authenticated: false,
            loading: false
          })
        }

      });
  }

  retrieveQuestionnaires() {

    var id = this.props.id;

    QuestionnaireDataService.getAll(id, this.props.lang ? this.props.lang : "ES")
      .then(response => {
        if (response.data == "") {
          this.setState({
            questionnaire: { "countryCode": "ES", "moduleId": id, "questions": [] },
            loading: false
          });
        } else {
          var questionnaires = response.data;

          this.setState({
            questionnaire: response.data[questionnaires.length - 1],
            loading: false
          });
        }

      })
      .catch(e => {
        if (e.response != null && e.response.status != null && e.response.status === 403) {
          console.log('unauthorized, logging out ...');
          this.setState({
            open: true,
            authenticated: false,
            loading: false
          })
        } else {
          this.setState({
            loading: false,
            error: e.response
          })
        }
      });
  }

  retrieveModule() {
    var id = this.props.id;
    var self = this;

    ModuleDataService.getModule(id)
      .then(response => {

        var countries = ["ES", "GB"];
        var customLabels = { "ES": "ES", "GB": "EN" };

        this.setState({
          currentModule: response.data,
          countries: countries,
          customLabels: customLabels
        });

        this.retrieveQuestionnaires();
        console.log(response.data);
      })
      .catch(e => {
        if (e.response != null && e.response.status != null && e.response.status === 403) {
          console.log('unauthorized, logging out ...');
          this.setState({
            open: true,
            authenticated: false,
            loading: false
          })
        } else {
          self.setState({
            loading: false,
            error: e.response,
            errorNet: e.message
          })
        }
      });
  }

  hideAnswers(field, e) {
    var questionnaire = this.state.questionnaire;
    var questions = questionnaire.questions;

    for (var i = 0; i < questions.length; i++) {

      var question = questions[i];

      if (question.number == field.question.number) {
        question.collapsed = true;
        break;
      }

    }

    this.setState({
      questionnaire: questionnaire
    });
  }

  showAnswers(field, e) {
    var questionnaire = this.state.questionnaire;
    var questions = questionnaire.questions;

    for (var i = 0; i < questions.length; i++) {

      var question = questions[i];

      if (question.number == field.question.number) {
        question.collapsed = false;
      } else {
        question.collapsed = true;
      }

    }

    this.setState({
      questionnaire: questionnaire
    });
  }


  handleQuestion = (field, e) => {

    var value = e.target.value;

    var questionnaire = this.state.questionnaire;
    var questions = questionnaire.questions;

    for (var x = 0; x < questions.length; x++) {

      if (questions[x].number == field.question.number) {
        questions[x].text = value;
        break;
      }
    }


    this.setState({
      questionnaire: questionnaire
    });
  }

  handleAnswer = (field, field2, e) => {


    var value = e.target.value;
    var questionnaire = this.state.questionnaire;
    var questions = questionnaire.questions;
    var question;

    for (var i = 0; i < questions.length; i++) {
      if (questions[i].number == field.question.number) {
        question = questions[i];
        break;
      }
    }

    var answers = question.answers;

    for (var x = 0; x < answers.length; x++) {
      var answer = answers[x];
      if (answer.number == field2.answer.number) {
        answer.text = value;
        break;
      }
    }

    this.setState({
      questionnaire: questionnaire
    });
  }

  handleRadioAnswer = (field, field2, e, value) => {



    var questionnaire = this.state.questionnaire;
    var questions = questionnaire.questions;
    var question;

    for (var i = 0; i < questions.length; i++) {

      if (questions[i].number == field.question.number) {
        question = questions[i];
        break;
      }
    }

    $("input[name='radio-answer_" + question.number + "']").each(function () {
      this.setCustomValidity('');
    });

    var answers = question.answers;

    for (var x = 0; x < answers.length; x++) {
      var answer = answers[x];

      if (answer.number == field2.answer.number) {
        answer.correct = true;
      } else {
        answer.correct = false;
      }
    }

    this.setState({
      questionnaire: questionnaire
    });
  }

  closeSaveAlert() {
    this.setState({
      errorSave: null,
      errorNetSave: null
    })
  }

  handleSubmit = (event) => {

    event.preventDefault();
    event.stopPropagation();

    var id = this.props.id;

    var self = this;

    self.setState({
      loading: true
    })

    var questionnaire = this.state.questionnaire;
    var questions = questionnaire.questions;

    for (var i = 0; i < questions.length; i++) {

      var question = questions[i];
      var answers = question.answers;

      for (var x = 0; x < answers.length; x++) {
        var answer = answers[x];
      }
    }

    questionnaire.createDate = new Date().getTime();

    ModuleDataService.create(questionnaire).then(response => {
      self.setState({
        loading: false,
        goToResults: true,
        madeModule: response.data
      })
    })
      .catch(e => {

        if (e.response != null && e.response.status != null && e.response.status === 403) {
          console.log('unauthorized, logging out ...');
          self.setState({
            open: true,
            authenticated: false,
            loading: false
          })
        } else {
          this.setState({
            loading: false,
            errorSave: e.response,
            errorNetSave: e.message
          })
        }
      });

  }

  handleStep() {
    this.setState({
      step: 2
    })
  }

  switchButton() {
    var questionnaire = this.state.questionnaire;

    if (questionnaire.questions && questionnaire.questions.length > 0) {
      return <button className="btn btn-lg btn-block button button--primary" tabIndex="2" type="submit" >{this.context.t('save')}</button>;
    }
  }

  render() {

    const { currentModule, questionnaire } = this.state;

    if (this.state.loading) {
      return (
        <div>
          {this.context.t('loading')}
        </div>
      )
    }

    if (this.state.goToResults) {
      var redirect = '/app/results/' + this.state.madeModule.id;
      return <Redirect to={redirect} />
    }

    if (!this.state.authenticated) {
      return (
        <Modal
          show={this.state.open}
          onHide={(_, reason) => { this.handleClose(reason) }}>
          <Modal.Header closeButton>
            <Modal.Title>{this.context.t('session.expired')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.context.t('session.msg')} <br />
            {this.context.t('session.redirect')}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={e => { this.handleClose() }} autoFocus>
              {this.context.t('accept')}
            </Button>
          </Modal.Footer>
        </Modal>
      )
    }

    if (this.state.error) {
      return (
        <Alert variant="danger" style={{ marginBottom: "20px" }}>
          <strong>{this.state.error.status}</strong>{this.context.t('error.unexpected')}
        </Alert>
      )
    }


    if (this.state.errorNet) {
      return (
        <Alert variant="danger" style={{ marginBottom: "20px" }}>
          {this.context.t('error.unexpected')}
        </Alert>
      )
    }

    let errorSave

    if (this.state.errorNetSave) {
      errorSave = <Alert variant="danger" style={{ marginBottom: "20px" }}>
        {this.context.t('could_not_record')}
      </Alert>;
    }

    if (this.state.errorSave) {
      errorSave = <Alert variant="danger" style={{ marginBottom: "20px" }}>
        <strong>{this.state.errorSave.status}</strong> {this.context.t('could_not_record')}
      </Alert>;
    }

    let modalFile

    if (this.state.files && this.state.files.length > 0) {
      modalFile = <Modal
        backdrop="static"
        keyboard={false}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        show={this.state.modalFileOpen}
        onHide={(_, reason) => { this.handleCloseFile(reason) }}>
        <Modal.Header closeButton>
          <Modal.Title>Video</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.state.video ?
            <video crossOrigin="anonymous" controls preload="metadata" autoPlay src={this.state.video.data} style={{ height: "auto", width: "100%" }} >
              <track label="English" kind="subtitles" srcLang="en" src={this.state.subtitle ? this.state.subtitle.data : ""} default />
            </video>
            :
            <div>{this.context.t('loading.video')}</div>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={e => { this.handleCloseFile() }} autoFocus>
            {this.context.t('accept')}
          </Button>
        </Modal.Footer>
      </Modal>;
    }

    return (
      <div>
        {errorSave}
        <Widget>
          <h2>
            {questionnaire.title}
          </h2>

          <blockquote>
            {questionnaire.description}
          </blockquote>

          <div style={{ marginBottom: "20px" }} />

          {
            this.state.step == 1 ?
              <div>
                {this.state.loadingFiles ?
                  <div style={{ width: "100%", padding: "10px" }}>
                    <div className="alert alert-info" role="info">
                      <i className="fa fa-info mx-2"></i>  {this.context.t('loading.file')}
                    </div>
                  </div>
                  :
                  <div style={{ width: "100%", padding: "10px" }}>
                    {this.state.files && this.state.files.length > 0 ?
                      <Button variant="danger" onClick={this.handleOpenFile} size="lg" style={{ width: "100%" }}>
                        <PlayIcon /> {this.context.t('play.video')}
                      </Button>
                      :
                      <div className="alert alert-warning" role="warning">
                        <i className="fa fa-info mx-2"></i> {this.context.t('file.noavailable')}
                      </div>
                    }
                  </div>
                }
                <div style={{ marginBottom: "20px" }} />
                <button className="btn btn-lg btn-block button button--primary" tabIndex="2" type="button" onClick={e => { this.handleStep() }}>{this.context.t('next')}</button>
              </div>
              :
              <Form validate="true" onSubmit={e => this.handleSubmit(e)} style={{ padding: "10px" }}>
                <div className="container-question mt-sm-5 my-1">
                  <Row>
                    {questionnaire.questions && questionnaire.questions.length > 0 ? questionnaire.questions && questionnaire.questions.map((question, index) => {
                      return (
                        <Col xs={12} lg={6}>
                          <div className="question ml-sm-5 pl-sm-5 pt-2">
                            <div className="py-2 h5"><b>{index + 1}. &nbsp;{question.text}?</b></div>
                            <div className="ml-md-3 ml-sm-3 pl-md-5 pt-sm-0 pt-3" id="options">
                              {question.answers && question.answers.length > 0 ? question.answers && question.answers.map(answer => {
                                return (
                                  <div>
                                    <label className="options">
                                      {answer.text}
                                      <input type="radio"
                                        required
                                        onInvalid={e => e.target.setCustomValidity(this.context.t('field.required'))} onValid={e => e.target.setCustomValidity('')}
                                        value={question.number + "_" + answer.number}
                                        name={"radio-answer_" + question.number}
                                        onChange={(e, val) => { this.handleRadioAnswer({ question }, { answer }, e, val) }}
                                      />
                                      <span className="checkmark"></span>
                                    </label>
                                  </div>
                                )
                              }) :
                                <div className="alert alert-warning" role="warning">
                                  {this.context.t('answers.empty')}
                                </div>
                              }
                            </div>

                          </div>
                        </Col>
                      )
                    }) :
                      <div className="alert alert-warning" role="warning">
                        {this.context.t('questions.empty')}
                      </div>
                    }
                  </Row>
                </div>

                <div style={{ marginBottom: "20px" }} />


                {this.switchButton()}

              </Form>
          }



        </Widget>

        {modalFile}
      </div>
    );
  }
}

Module.contextTypes = {
  t: PropTypes.func.isRequired
}

export default connect(state => ({
  lang: state.i18nState.lang
}))(Module)
