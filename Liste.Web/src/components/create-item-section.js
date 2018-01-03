import React from 'react';
import Section from './section.js';
import FontAwesome from './font-awesome.js';
import axios from 'axios';
import FormData from 'form-data';
import classNames from 'classnames';
import './create-item-section.css';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentBackgroundStyle: null,
            description: null,
            picture: null,
        };
    }

    setBackgroundUrl(url) {
        this.setState({
            currentBackgroundStyle: {
                backgroundImage: `url('${url}')`,
                backgroundSize: `cover`,
                backgroundRepeat: `no-repeat`,
                backgroundPosition: `50% 50%`,
            }
        });
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
        // TODO denisok: extract parameter
        const form = new FormData({ maxDataSize: 2000000 });

        form.append('description', this.state.description);
        form.append('picture', this.state.picture);

        axios.post('http://localhost:8080/cuir', form)
            .then(function (response) {
                console.log('success: %o', response);
            })
            .catch(function (error) {
                console.log('error: %o', error);
            });
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

        return (
            <Section appearanceClass={this.props.appearanceClass}
                title="proposer un objet"
                onClose={this.props.onClose}>

                <form className={classNames("add-item-form", { hide: this.state.hide })}
                    onMouseEnter={() => this.setState({ hide: true })}
                    onMouseLeave={() => this.setState({ hide: false })}>
                    <input type="text" name="description" placeholder="DESCRIPTION"
                        onChange={this.onDescriptionChange} />
                    <div className="decoration-under-input"></div>
                    <div className="add-item-picture"
                        style={this.state.currentBackgroundStyle}>

                        {/* Input: upload file */}
                        <label className="picture-upload-area">
                            {/* Input: upload file */}
                            <input type="file" name="picture" className="debug"
                                accept=".jpg,.jpeg"
                                onChange={this.onPictureChange} />

                            {/* Overlay */}
                            <div className="picture-upload-overlay">
                                {uploadPhotoPlaceholder}
                            </div>
                        </label>

                        {/* Submit button */}
                        <button className="submit-item-btn" type="button"
                            onClick={this.onSubmit}>
                            <FontAwesome iconName="check" />
                        </button>
                    </div>
                </form>
            </Section>
        );
    }
}