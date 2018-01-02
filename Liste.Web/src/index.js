import React from 'react';
import ReactDOM from 'react-dom';
import FacebookLogin from 'react-facebook-login';
import fetch from 'node-fetch';
import './index.css';
import FontAwesome from './components/font-awesome.js';
import Section from './components/section.js';
import classNames from 'classnames';

const apiHost = "http://localhost:8080";

function fetchStartupData() {
    return fetch(apiHost + '/startup');
}

class CreateItemSection extends React.Component {
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
                <form className="add-item-form">
                    <input type="text" name="description" placeholder="DESCRIPTION" />
                    <div className="decoration-under-input"></div>
                    <div className="add-item-picture"
                        style={this.state.currentBackgroundStyle}>

                        {/* Input: upload file */}
                        <label className="picture-upload-area">
                            {/* Input: upload file */}
                            <input type="file" name="picture" className="debug"
                                onChange={(e) => this.tryPreviewImage(e)} />

                            {/* Overlay */}
                            <div className="picture-upload-overlay">
                                {uploadPhotoPlaceholder}
                            </div>
                        </label>

                        {/* Submit button */}
                        <button className="submit-item-btn">
                            <FontAwesome iconName="check" />
                        </button>
                    </div>
                </form>
            </Section>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isConnected: true,
            fbAccessToken: null,
            profilePicture: null,
            currentSection: 'add-object',
        };
    }

    onLoggedInFacebook(response) {
        console.log(response);
        this.setState({
            isConnected: true,
            fbAccessToken: response.accessToken,
        });

        fetch("https://graph.facebook.com/v2.11/me?fields=id,name,picture,friends&access_token=" + this.state.fbAccessToken)
            .then(response => response.json())
            .then(function (body) {
                this.setState({ profilePicture: body.picture.data.url })
            }.bind(this));
    }

    appearanceClass(sectionName) {
        if (this.state.currentSection === sectionName)
            return "section-is-active";
        else
            return "";
        //return classNames({ 'section-is-active': this.state.currentSection != null });
    }

    openSection(sectionName) {
        if (this.state.currentSection != sectionName)
            this.setState({ currentSection: sectionName });
        else
            this.closeSection();
    }

    closeSection() {
        this.setState({ currentSection: null });
    }

    render() {
        if (this.state.isConnected == null) {
            return <div className="container">
                <h1>loading...</h1>
                <FacebookLogin hidden="true"
                    appId="154773301822164"
                    autoLoad={true}
                    scope="public_profile,user_friends"
                    callback={(response) => this.onLoggedInFacebook(response)} />
            </div>;
        }
        else if (this.state.isConnected === false) {
            return <div className="container">
                <h1>Pas connecté</h1>
                <FacebookLogin
                    appId="154773301822164"
                    autoLoad={true}
                    scope="public_profile,user_friends"
                    callback={(response) => this.onLoggedInFacebook(response)} />
            </div>;
        }
        else {
            // 0) Install fetch to have an HTTP client
            // 0.1) Allow CORS in the API
            // 1) Charger liste d'amis
            // 2) Charger liste des objets disponibles
            // 3) Créer bot
            // 4) Envoyer photo à Bot

            return (
                <div className="container">
                    <div id="title" className={this.appearanceClass()}>
                        liste <i className="fa fa-hand-pointer-o" aria-hidden="true"></i> 
                    </div>
                    {this.state.profilePicture &&
                        <img src={this.state.profilePicture} alt="" />}

                    <nav className={this.appearanceClass()}>
                        <a className="nav-item" onClick={() => this.openSection('add-object')}>&gt; proposer un objet</a>
                        <a className="nav-item" onClick={() => this.openSection('process-gift')}>&gt; conclure un deal</a>
                        <a className="nav-item" onClick={() => this.openSection('explore')}>&gt; explorer</a>
                    </nav>

                    {/* Section: add object */}
                    <CreateItemSection appearanceClass={this.appearanceClass("add-object")}
                                       onClose={() => this.closeSection()} />

                    {/* Section: process-gift */}
                    <Section appearanceClass={this.appearanceClass("process-gift")}
                             title="conclure un deal"
                             onClose={() => this.closeSection()} />

                    {/* Section: explorer */}
                    <Section appearanceClass={this.appearanceClass("explore")}
                             title="explorer"
                             onClose={() => this.closeSection()} />
                </div>
            );

            //<div><button onClick={() => this.setState({ isConnected: false }) }>Logout</button></div>
        }
    }
}

// ========================================

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
