import { ReactNode, useEffect, useState } from 'react';
//3rd party libraries
import SwapOutlined from '@ant-design/icons/SwapOutlined';
import { Button, Input, message, Select } from 'antd';
import moment, { Moment } from 'moment';
//@ts-ignore
import ReactCountryFlag from "react-country-flag";

import './forex-converter.css';
import { HOST_IP } from '../common';

//Hard code currency full names, country code and symbols since there are currently only 4 supported currencies.
//These could be obtained from an api if the list grows and is dynamic
const FOREX_CURRENCY_FULL_NAME: Record<string, {name: string, countryCode?:string, symbol?:string}> = {
    "AUD": {name: "Australian Dollar", countryCode: "AU", symbol: "$"},
    "USD": {name: "US Dollar", countryCode: "US", symbol: "$"},
    "NZD": {name: "New Zealand Dollar", countryCode: "NZ", symbol: "$"},
    "JPY": {name: "Japanese Yen", countryCode: "JP", symbol: "¥"},
    "CNY": {name: "Chinese Yuan Renminbi", countryCode: "CN", symbol: "¥"}
}

const { Option } = Select;

interface IForexConverterProps {
}

interface IRateInfo {
    rate: number,
    lastUpdate: Moment
}

enum ConvertDirection {
    FromBase,
    ToBase
}

const ForexConverter: React.FC<IForexConverterProps> = (props) => {

    const [amount, setAmount] = useState<string>("1.00");
    const [forexRates, setForexRates] = useState<Map<string, IRateInfo>>(new Map());
    const [currentCurrency, setCurrentCurrency] = useState<string>();
    const [convertDirection, setConvertDirection] = useState<ConvertDirection>(ConvertDirection.FromBase);

    //Gets the latest forex rates from the server
    useEffect(() => {
        let isMount = true;
        fetch(`http://${HOST_IP}:8080/rates`, { method: 'GET' })
        .then(res => res.json())
        .then((response) => {
            if (!isMount) return;
            processForexRateResponse(response);
        }, (response) => {
            message.error("An unexpected error ocurred", 10);
        });
        return () => {
            isMount = false;
        };
    }, []);

    //Processes the response and stores the forex data in react state
    function processForexRateResponse(response: any) {
        let rates = new Map();
        let initialCurrency: string = "";
        for(let rateInfo of response.rates) {
            let targetCurrency: string = rateInfo._id.substring(3,6);

            if(!initialCurrency) initialCurrency = targetCurrency; 

            let rate: IRateInfo = {
                rate: rateInfo.rate as number,
                lastUpdate: moment(rateInfo.lastUpdated)
            }

            rates.set(targetCurrency, rate);
        }
        setForexRates(rates);
        setCurrentCurrency(initialCurrency);
    }

    function handleCurrencyChange(value: string) {
        setCurrentCurrency(value);
    }

    function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
        setAmount(e.target.value);
    }

    function handleSwapCurrency() {
        setConvertDirection(convertDirection === ConvertDirection.FromBase ? ConvertDirection.ToBase : ConvertDirection.FromBase);
    }

    function setAmountPrecision() {
        setAmount(Number(amount).toFixed(2))
    }

    //Calculates and returns a string for the converted currency
    function convertedCurrency() {
        if(currentCurrency && forexRates.get(currentCurrency)?.rate){
            let rate = forexRates.get(currentCurrency)?.rate;
            if(rate && convertDirection === ConvertDirection.FromBase) {
                return `${(Number(amount) * rate).toPrecision(6)} ${FOREX_CURRENCY_FULL_NAME[currentCurrency] ? FOREX_CURRENCY_FULL_NAME[currentCurrency].name : currentCurrency}`
            } else if(rate && convertDirection === ConvertDirection.ToBase) {
                return `${(Number(amount) * ( 1 / rate)).toPrecision(6)} ${FOREX_CURRENCY_FULL_NAME["AUD"] ? FOREX_CURRENCY_FULL_NAME["AUD"].name : "AUD"}`
            }
        }
    }

    function sourceCurrency() {
        if(convertDirection === ConvertDirection.FromBase) {
            return (<>{Number(amount).toFixed(2)} Australian {Number(amount) === 1 ? "Dollar" : "Dollars"} =</>)
        } else if(convertDirection === ConvertDirection.ToBase) {
            return (<>{Number(amount).toFixed(2)} {FOREX_CURRENCY_FULL_NAME[currentCurrency!] ? FOREX_CURRENCY_FULL_NAME[currentCurrency!].name : currentCurrency} =</>)
        }
    }

    function inputPrefix() {
        if(convertDirection === ConvertDirection.FromBase) {
            return FOREX_CURRENCY_FULL_NAME["AUD"] ? FOREX_CURRENCY_FULL_NAME["AUD"!].symbol : '$';
        } else if(convertDirection === ConvertDirection.ToBase) {
            return FOREX_CURRENCY_FULL_NAME[currentCurrency!] ? FOREX_CURRENCY_FULL_NAME[currentCurrency!].symbol : '';
        }
    }

    function displayExchangeRate() {
        if(convertDirection === ConvertDirection.FromBase) {
            return (Number(amount) !== 1 && currentCurrency) ? `1 AUD = ${forexRates.get(currentCurrency)?.rate.toPrecision(6)}` : ''
        } else {
            return (Number(amount) !== 1 && currentCurrency) ? `1 ${currentCurrency} = ${(1 / forexRates.get(currentCurrency)!.rate).toPrecision(6)}` : ''
        }
    }

    function renderTargetCurrencyOptions() {
        let options:ReactNode[] = [];
        forexRates.forEach((value, key) => {
            options.push(
                <Option key={key} value={key} className="target-currency-option">{renderCountryFlag(key)}{key}{FOREX_CURRENCY_FULL_NAME[key] ? ` - ${FOREX_CURRENCY_FULL_NAME[key].name}` : ''}</Option>
            );
        });
        return options;
    }

    function renderCountryFlag(key: string) {
        if(FOREX_CURRENCY_FULL_NAME[key]?.countryCode) {
            return (<ReactCountryFlag countryCode={FOREX_CURRENCY_FULL_NAME[key].countryCode} className="country-flag" style={{height: "1.2em", width: "1.2em"}} svg />)
        }
    }

    return (
        <div className="forex-converter">
            <div className="forex-amount">
                <span className="field-heading">Amount</span>
                <Input
                    className="forex-input-amount"
                    value={amount}
                    type="number"
                    onBlur={setAmountPrecision}
                    onChange={handleAmountChange}
                    prefix={inputPrefix()}
                />
            </div>
            <div className={`source-currency ${convertDirection === ConvertDirection.ToBase ? 'swap' : ''}`}>
                <span className="field-heading">{`${convertDirection === ConvertDirection.ToBase ? 'To' : 'From'}`}</span>
                <div className="source-currency-value">
                    {renderCountryFlag("AUD")} {FOREX_CURRENCY_FULL_NAME["AUD"].name}
                </div>
            </div>
            <div className="swap-currency">
                <Button type="primary" onClick={handleSwapCurrency} className="swap-btn">
                    <SwapOutlined />
                </Button>
            </div>
            <div className={`target-currency ${convertDirection === ConvertDirection.ToBase ? 'swap' : ''}`}>
                <span className="field-heading">{`${convertDirection === ConvertDirection.FromBase ? 'To' : 'From'}`}</span>
                <Select loading={!currentCurrency ? true : false} value={currentCurrency} dropdownStyle={{ width: "100%" }} onChange={handleCurrencyChange} data-testid="target-currency-select">
                    {renderTargetCurrencyOptions()}
                </Select>
            </div>
            <div className="converted-amount" hidden={!currentCurrency ? true : false}>
                <span>
                    {sourceCurrency()}
                </span>
                <span className="converted-value">
                    {convertedCurrency()}
                </span>
                <span className="secondary-info">
                    <span className="exchange-rate">
                        {displayExchangeRate()}
                    </span>
                    <span className="last-updated">
                        {currentCurrency && `Rates last updated: ${forexRates.get(currentCurrency)?.lastUpdate.utc().format("DD MMM YYYY, HH:mm UTC")}`}
                    </span>
                </span>
            </div>
        </div>
    )
}

export default ForexConverter;