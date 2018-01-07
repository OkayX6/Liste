import React from 'react';
import Section from './section.js';
import FontAwesome from './font-awesome.js';
import axios from 'axios';
import FormData from 'form-data';
import classNames from 'classnames';
import './create-item-section.css';
import * as FormState from './form-state.js';

const InitialState = {
    currentBackgroundStyle: null,
    description: null,
    picture: null,
};

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = InitialState;
    }

    setBackgroundUrl(url) {
        this.setState({
            currentBackgroundStyle: {
                backgroundImage: `url('${url}')`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '50% 50%',
            }
        });
    }

    updateFormState = (newState) => {
        this.props.updateFormState(newState);
    }

    isPictureLoaded() {
        return this.state.currentBackgroundStyle != null &&
            this.state.currentBackgroundStyle.backgroundImage != null;
    }

    onDescriptionChange = (event) => {
        this.setState({ description: event.target.value });
    }

    onPictureChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            var pictureFile = event.target.files[0];
            this.setState({ picture: pictureFile });

            var reader = new FileReader();
            
            reader.onload = function (e) {
                this.setBackgroundUrl(e.target.result);
            }.bind(this);

            reader.readAsDataURL(pictureFile);
        }
    }

    onSubmit = (event) => {
        // Max data: 2 MB
        // TODO denisok: refactor constant somewhere
        const form = new FormData({ maxDataSize: 2000000 });

        form.append('description', this.state.description);
        form.append('picture', this.state.picture);

        this.updateFormState(FormState.Processing);

        axios.post('http://localhost:8080/items', form, {
                params: {
                    userId: this.props.userId,
                }
            })
            .then(function (response) {
                this.updateFormState(FormState.Success);
                this.onClose();
            }.bind(this))
            .catch(function (error) {
                this.updateFormState(FormState.Failure);
            }.bind(this));
    }

    onClose = () => {
        this.updateFormState(FormState.Closed);
        this.props.onClose();
        this.setState(InitialState);
    }

    render() {
        var uploadPhotoPlaceholder = null;
        if (this.isPictureLoaded() == false) {
            uploadPhotoPlaceholder = (
                <div>
                    <FontAwesome iconName="cloud-upload" />
                    &nbsp;uploader photo
                </div>
            );
        }

        var child = null;
        if (this.props.formState == FormState.Initial) {
            child = (
                <form className={classNames("add-item-form", this.props.formState)}
                >
                    <input type="text" name="description" placeholder="DESCRIPTION"
                        onChange={this.onDescriptionChange} />
                    <div className="decoration-under-input"></div>
                    <div className="add-item-picture"
                        style={this.state.currentBackgroundStyle}>

                        {/* Input: upload file */}
                        <label className="picture-upload-area">
                            {/* Input: upload file */}
                            <input type="file" name="picture"
                                accept=".jpg,.jpeg"
                                onChange={this.onPictureChange} />

                            {/* Overlay */}
                            <div className="picture-upload-overlay">
                                {uploadPhotoPlaceholder}
                            </div>
                        </label>

                        {/* Submit button */}
                        <button className="submit-item-btn" type="button"
                            onClick={this.onSubmit}
                            disabled={this.props.formState == FormState.Processing}>
                            ENVOYER
                        </button>
                    </div>
                </form>
            );
        }
        else if (this.props.formState == FormState.Processing) {
            child = "traitement...";
        }
        else if (this.props.formState == FormState.Success) {
            child = <div>
                ajouté&nbsp;<FontAwesome iconName="check" />
            </div>;
        }
        else if (this.props.formState == FormState.Failure) {
            child = <div>
                échec&nbsp;<FontAwesome iconName="times" />
            </div>;
        }
        else if (this.props.formState == FormState.Closed) {
            child = "fermé";
        }

        return (
            <Section appearanceClass={this.props.appearanceClass}
                title="proposer un objet"
                onClose={this.onClose}>
                <div className={classNames("form-container flex-center-children-vertically", this.props.formState)}>
                    {child}
                </div>
            </Section>
        );
    }
}