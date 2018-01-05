import React from 'react';
import Section from './section.js';
import FontAwesome from './font-awesome.js';
import axios from 'axios';
import classNames from 'classnames';
import './explore-section.css';

export default class extends React.Component {
    onClose = () => {
        this.props.onClose();
    }

    render() {
        const pictures = this.props.items.map((item) => {
            const url = 'http://localhost:8080/' + this.props.userId + '/' + item.PictureFileName;

            return <div key={item.Id}
                className="item-thumbnail"
                style={{
                    backgroundImage: `url('${url}')`,
                    width: "300px",
                    height: "300px",
                }}>

                {/* Delete button */}
                <button>
                    <FontAwesome iconName="trash-o" />
                </button>

                {/* Invisible white space */}
                <div className="flex-expand-1"></div>

                {/* Thumbnail description */}
                <div className="item-thumbnail-desc">
                    {item.Description}
                </div>
            </div>;
        });

        return (
            <Section appearanceClass={this.props.appearanceClass}
                title="explorer"
                onClose={this.onClose}>
                <div style={{
                    display: "flex",
                    flexWrap: "wrap",
                    width: "100%",
                }}>
                    {pictures}
                    <div style={{ width: '100%', height: '50px' }}></div>
                </div>
            </Section>
        );
    }
}