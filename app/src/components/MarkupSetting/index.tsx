import React, { useEffect } from 'react';

//3rd party libraries
import { Button, Form, FormInstance, Input, message } from 'antd';

import './markup-setting.css';
import { HOST_IP } from '../common';

interface IMarkupSettingProps {
}

const MarkupSetting: React.FC<IMarkupSettingProps> = (props) => {

    let formRef = React.createRef<FormInstance>();

    useEffect(() => {
        getMarkupSetting();
    }, []);

    //Fetches and sets the current markup percentage value
    function getMarkupSetting() {
        fetch(`http://${HOST_IP}:8080/markup`, { method: 'GET' })
        .then(res => res.json())
        .then((response) => {
            if(response.value) {
                //Set the form to display the current markup percentage
                formRef.current?.setFieldsValue({
                    markupPercentage: response.value,
                });
            }
        }, (response) => {
            message.error("An unexpected error ocurred", 10);
        });
    }

    //Sends a post request to the server to save the new markup percentage
    function postMarkupSetting(value: number){
        fetch(`http://${HOST_IP}:8080/markup`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value: value    
            })
        })
        .then(res => res.json())
        .then((response) => {
            if(response.error) {
                message.error(response.error);
            } else if(response.status) {
                message.info(response.status);
            }
        })
        .catch((response) => {
            message.error(response.error);
        });
    }

    //Save the markup percentage setting when the form is submitted
    function onFinish(values: any){
        if(values.markupPercentage) {
            postMarkupSetting(values.markupPercentage);
        }
    }

    return (
        <div className="markup-setting">
            <Form
                className="markup-setting-form"
                ref={formRef}
                onFinish={onFinish}
            >
                <Form.Item
                    label="Markup Percentage"
                    name="markupPercentage"
                    rules={[{ 
                        required: true,
                        message: "Please enter a markup percentage"
                    },
                    () => ({
                        validator(_, value) {
                        let markup = Number(value);
                        if (!isNaN(Number(markup)) && markup >= 0 && markup <= 100) {
                            return Promise.resolve();
                        }
                        return Promise.reject(new Error('Markup percentage must be between 0-100'));
                        },
                    })
                    ]}
                >
                    <Input type="number" suffix="%"/>
                </Form.Item>
                <Form.Item>
                    <Button className="right-btn" type="primary" htmlType="submit">Save</Button>
                </Form.Item>
            </Form>
        </div>
    )
}

export default MarkupSetting;