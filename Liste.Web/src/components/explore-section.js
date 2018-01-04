import React from 'react';
import Section from './section.js';
import FontAwesome from './font-awesome.js';
import axios from 'axios';
import classNames from 'classnames';

export default class extends React.Component {
    componentDidMount() {
        if (this.props.userId) {
            axios
                .get('http://localhost:8080/items', {
                    params: {
                        userId: this.props.userId
                    }
                })
                .then(function (response) {
                    console.log('items: %o', response.data);
                    this.setState({
                        items: response.data
                    });
                }.bind(this));
        }
    }

    onClose = () => {
        this.props.onClose();
    }

    render() {
        const pictures = this.props.items.map((item) => {
            const url = 'http://localhost:8080/' + this.props.userId + '/' + item.PictureFileName;

            return <div key={item.PictureFileName}
                style={{
                    backgroundImage: `url('${url}')`,
                    backgroundSize: `cover`,
                    backgroundRepeat: `no-repeat`,
                    backgroundPosition: `50% 50%`,
                    width: `300px`,
                    height: `300px`,
                }}>
            </div>;
        }
        );

        return (
            <Section appearanceClass={this.props.appearanceClass}
                title="explorer"
                onClose={this.onClose}>
                <div style={{
                    display: `flex`,
                    flexWrap: `wrap`,
                    position: `relative`,
                    marginTop: `2rem`,
                    left: `0`,
                    right: `2rem`,
                }}>
                    {pictures}
                </div>
            </Section>
        );
    }
}