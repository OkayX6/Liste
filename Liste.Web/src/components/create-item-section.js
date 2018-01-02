import React from 'react';
import Section from './section.js';
import FontAwesome from './font-awesome.js';
import classNames from 'classnames';

export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentBackgroundStyle: null,
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

    tryPreviewImage(evt) {
        if (evt.target.files && evt.target.files[0]) {
            var reader = new FileReader();
            
            reader.onload = function (e) {
                this.setBackgroundUrl(e.target.result);
            }.bind(this);

            reader.readAsDataURL(evt.target.files[0]);
        }
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
                    <input type="text" name="description" placeholder="DESCRIPTION" />
                    <div className="decoration-under-input"></div>
                    <div className="add-item-picture"
                        style={this.state.currentBackgroundStyle}>

                        {/* Input: upload file */}
                        <label className="picture-upload-area">
                            {/* Input: upload file */}
                            <input type="file" name="picture" className="debug"
                                accept=".jpg,.jpeg"
                                onChange={(e) => this.tryPreviewImage(e)} />

                            {/* Overlay */}
                            <div className="picture-upload-overlay">
                                {uploadPhotoPlaceholder}
                            </div>
                        </label>

                        {/* Submit button */}
                        <button className="submit-item-btn" type="button">
                            <FontAwesome iconName="check" />
                        </button>
                    </div>
                </form>
            </Section>
        );
    }
}