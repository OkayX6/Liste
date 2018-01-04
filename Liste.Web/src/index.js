import React from 'react';
import ReactDOM from 'react-dom';
import FontAwesome from './components/font-awesome.js';
import Section from './components/section.js';
import CreateItemSection from './components/create-item-section.js';
import ExploreSection from './components/explore-section.js';
import classNames from 'classnames';
import axios from 'axios';
import * as FormState from './components/form-state.js';
import './index.css';

const apiHost = "http://localhost:8080";

function Title() {
    return (
        <div id="title" className="title-style">
            liste <FontAwesome iconName="hand-pointer-o" />
        </div>
    );
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isConnected: null,
            userId: null,
            fbAccessToken: null,
            name: null,
            profilePictureUrl: null,
            //currentSection: null,
            currentSection: 'add-object',
            addItemFormState: FormState.Initial,
            items: [],
        };
    }

    componentDidMount() {
        // Facebook SDK loading
        // REF: https://medium.com/front-end-hacking/facebook-authorization-in-a-react-app-b7a9176aacb6
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: '154773301822164',
                autoLogAppEvents: true,
                cookie: true,
                xfbml: true,
                version: 'v2.11'
            });

            // Get FB login status
            window.FB.Event.subscribe('auth.statusChange', this.onFbStatusChanged);
            window.FB.getLoginStatus(this.onFbStatusChanged.bind(this));
        }.bind(this);

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }

    connectWithFb = () => {
        window.FB.login(this.onFbStatusChanged);
    }

    queryStartupData = () => {
        axios
            .get(apiHost + '/startup', {
                params: {
                    userId: this.state.userId,
                    accessToken: this.state.fbAccessToken
                }
            })
            .then((response) => {
                this.setState({
                    name: response.data.Name,
                    profilePictureUrl: response.data.PictureUrl
                });
            });
    }

    queryItemsData = () => {
        axios
            .get(apiHost + '/items', {
                params: {
                    userId: this.state.userId
                }
            })
            .then((response) => {
                this.setState({
                    items: response.data
                });
            }); 
    }

    onFbStatusChanged = (response) => {
        if (response.authResponse && response.authResponse.accessToken &&
            response.authResponse.accessToken == this.state.fbAccessToken)
            return;

        if (response.status === 'connected') {
            this.setState({
                isConnected: true,
                userId: response.authResponse.userID,
                fbAccessToken: response.authResponse.accessToken,
            });

            this.queryStartupData();
            this.queryItemsData();
        }
        else {
            this.setState({ isConnected: false });
        }
    }

    appearanceClass(sectionName) {
        if (this.state.currentSection === sectionName)
            return "section-is-active";
        else
            return "";
    }

    openSection(sectionName) {
        if (this.state.currentSection != sectionName)
            this.setState({ currentSection: sectionName });
        else
            this.closeSection();
    }

    openAddItemSection = () => {
        this.updateAddItemSectionFormState(FormState.Initial);
        this.openSection('add-item');
    }

    updateAddItemSectionFormState = (state) => {
        this.setState({ addItemFormState: state });

        if (state == FormState.Success) {
            this.queryItemsData();
        }
    }

    closeSection = () => {
        this.setState({ currentSection: null });
    }

    render() {
        if (this.state.isConnected == null) {
            return <div className="container">
                <div className="header-area">
                    <Title />
                </div>
                <div className="global-msg-container">
                    <h2>chargement...</h2>
                </div>
            </div>;
        }
        else if (this.state.isConnected == false) {
            return <div className="container">
                <div className="header-area">
                    <Title />
                </div>
                <div className="global-msg-container">
                    <h2 onClick={this.connectWithFb}>connecte-toi</h2>
                    <div id="fbButton" className="fb-login-button" data-max-rows="1" data-size="large" data-button-type="continue_with" data-show-faces="false" data-auto-logout-link="false" data-use-continue-as="true">
                    </div>
                </div>
            </div>;
        }
        else {
            // [x] Install axios to have an HTTP client
            // [x] Allow CORS in the API
            // [ ] Charger liste d'amis
            // [x] Charger liste des objets disponibles
            // [ ] Créer bot - pour récupérer les images
            // [ ] Envoyer photo à Bot

            return (
                <div className="container">
                    <div className="header-area">
                        <Title />
                        {/*<button>Cuir</button>*/}
                    </div>
                    <div className="footer-area">
                        <img src={this.state.profilePictureUrl} alt=""
                             width="50" height="50" />
                        <button id="disconnectButton" onClick={() => window.FB.logout()}>
                            se déconnecter
                        </button>
                    </div>

                    <nav className={this.appearanceClass()}>
                        <a className="nav-item" onClick={() => this.openAddItemSection()}>&gt; proposer un objet</a>
                        <a className="nav-item" onClick={() => this.openSection('process-gift')}>&gt; conclure un deal</a>
                        <a className="nav-item" onClick={() => this.openSection('explore')}>&gt; explorer</a>
                    </nav>

                    <div id="sectionContainer">
                        {/* Section: add item */}
                        <CreateItemSection appearanceClass={this.appearanceClass("add-item")}
                            userId={this.state.userId}
                            formState={this.state.addItemFormState}
                            updateFormState={this.updateAddItemSectionFormState}
                            onClose={this.closeSection} />

                        {/* Section: process-gift */}
                        <Section appearanceClass={this.appearanceClass("process-gift")}
                                 title="conclure un deal"
                                 onClose={this.closeSection} />

                        {/* Section: explorer */}
                        <ExploreSection appearanceClass={this.appearanceClass("explore")}
                                 userId={this.state.userId}
                                 items={this.state.items}
                                 onClose={this.closeSection} />
                    </div>
                </div>
            );
        }
    }
}

// ========================================

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
