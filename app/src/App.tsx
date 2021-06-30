import { Router, navigate } from "@reach/router";

import ForexConverter from './components/ForexConverter';
import MarkupSetting from './components/MarkupSetting';

import './App.css';
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';

const ForexPage = (props: any) => {
  return (
    <div className="page">
      <ForexConverter />
    </div>
  );
}

const SettingsPage = (props: any) => {
  return(
    <div className="page">
      <MarkupSetting />
    </div>
  );
}

function App() {
  return (
    <Layout className="app-layout">
      <Header className="header">
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
          <Menu.Item key="1" onClick={() => navigate('/')}>Exchange Rate Converter</Menu.Item>
          <Menu.Item key="2" onClick={() => navigate('settings')}>Settings</Menu.Item>
        </Menu>
      </Header>
      <Content className="app-content">
        <Router className="app-router">
          <ForexPage path='/' />
          <SettingsPage path='/settings' />
        </Router>
      </Content>
    </Layout>
  );
}

export default App;
