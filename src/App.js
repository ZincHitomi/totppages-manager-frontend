import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
    Layout,
    Menu,
    Button,
    Table,
    Input,
    Upload,
    message,
    Modal,
    Popconfirm,
    Switch,
    Radio,
    List,
    Card,
    Typography,
    Space,
    Empty,
    Spin,
    Alert,
    Row,
    Col
} from 'antd';
import {
    PlusOutlined,
    UploadOutlined,
    QrcodeOutlined,
    ClearOutlined,
    SyncOutlined,
    DeleteOutlined,
    MenuOutlined
} from '@ant-design/icons';
import {PageContainer} from '@ant-design/pro-layout';
import {QRCodeSVG} from 'qrcode.react';
import jsQR from 'jsqr';
import 'antd/dist/reset.css';
import * as api from './services/api';
import config from './config';
import {useMediaQuery} from 'react-responsive';

// ... (previous imports and component definitions remain the same)

function App() {
    // ... (previous state definitions and functions remain the same)

    const isDesktopOrLaptop = useMediaQuery({minWidth: 1024});
    const isTabletOrMobile = useMediaQuery({maxWidth: 1023});

    const renderContent = () => (
        <PageContainer>
            <Card style={{marginTop: 16}}>
                <Space direction="vertical" size="large" style={{width: '100%'}}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={24} md={24} lg={12}>
                            <Space direction="vertical" style={{width: '100%'}}>
                                <Input
                                    placeholder="用户信息"
                                    value={userInfo}
                                    onChange={(e) => setUserInfo(e.target.value)}
                                    style={{width: '100%'}}
                                />
                                <Input
                                    placeholder="密钥"
                                    value={secret}
                                    onChange={(e) => setSecret(formatSecret(e.target.value))}
                                    style={{width: '100%'}}
                                />
                                <Button type="primary" onClick={addTOTP} icon={<PlusOutlined/>} style={{width: '100%'}}>
                                    添加
                                </Button>
                            </Space>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={12}>
                            <Space direction="vertical" style={{width: '100%'}}>
                                <Switch
                                    checked={syncEnabled}
                                    onChange={handleSyncToggle}
                                    checkedChildren="同步开启"
                                    unCheckedChildren="同步关闭"
                                    style={{width: '100%'}}
                                />
                                {syncEnabled && (
                                    <>
                                        <Button onClick={showBackupModal} icon={<UploadOutlined/>} style={{width: '100%'}}>
                                            上传
                                        </Button>
                                        <Button onClick={showRestoreModal} icon={<SyncOutlined/>} style={{width: '100%'}}>
                                            恢复
                                        </Button>
                                    </>
                                )}
                                <Button
                                    onClick={() => Modal.confirm({
                                        title: '确认清除所有TOTP？',
                                        content: '此操作将删除所有已添加的TOTP，不可恢复。',
                                        onOk: clearAllTOTPs,
                                        okText: '确认',
                                        cancelText: '取消',
                                    })}
                                    icon={<ClearOutlined/>}
                                    danger
                                    style={{width: '100%'}}
                                >
                                    清除所有
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                    <Dragger {...draggerProps}>
                        <p className="ant-upload-drag-icon">
                            <QrcodeOutlined/>
                        </p>
                        <p className="ant-upload-text">点击或拖拽二维码图片到此区域以导入TOTP</p>
                    </Dragger>
                    {importStatus.loading && (
                        <div style={{textAlign: 'center', marginTop: '10px'}}>
                            <Spin tip="正在导入TOTP..."/>
                        </div>
                    )}
                    {importStatus.count > 0 && (
                        <div style={{textAlign: 'center', marginTop: '10px'}}>
                            <Alert
                                message={`成功导入 ${importStatus.count} 个TOTP`}
                                type="success"
                                showIcon
                            />
                        </div>
                    )}
                    <Table
                        columns={columns}
                        dataSource={totps}
                        rowKey="id"
                        locale={{
                            emptyText: 'TOTP列表为空'
                        }}
                        pagination={{pageSize: 10}}
                        scroll={{x: 'max-content'}}
                    />
                </Space>
            </Card>
        </PageContainer>
    );

    return (
        <Layout style={{minHeight: '100vh'}}>
            {isDesktopOrLaptop ? (
                <>
                    <Header style={{display: 'flex', alignItems: 'center'}}>
                        <div className="logo"
                             style={{color: 'white', fontSize: '18px', fontWeight: 'bold', marginRight: '20px'}}>
                            TOTP Token Manager
                        </div>
                        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} style={{flex: 1}}>
                            <Menu.Item key="1">主页</Menu.Item>
                        </Menu>
                    </Header>
                    <Content style={{padding: '0 50px'}}>
                        {renderContent()}
                    </Content>
                </>
            ) : (
                <Layout>
                    <Sider trigger={null} collapsible collapsed={collapsed}>
                        <div className="logo"
                             style={{height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.3)'}}/>
                        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
                            <Menu.Item key="1" icon={<QrcodeOutlined/>}>
                                TOTP管理
                            </Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout className="site-layout">
                        <Header className="site-layout-background" style={{padding: 0}}>
                            {React.createElement(collapsed ? MenuOutlined : MenuOutlined, {
                                className: 'trigger',
                                onClick: () => setCollapsed(!collapsed),
                            })}
                        </Header>
                        <Content
                            className="site-layout-background"
                            style={{
                                margin: '24px 16px',
                                padding: 24,
                                minHeight: 280,
                            }}
                        >
                            {renderContent()}
                        </Content>
                    </Layout>
                </Layout>
            )}
            <Footer style={{textAlign: 'center'}}>
                TOTP Token Manager ©{new Date().getFullYear()} Created by Lones
            </Footer>

            {/* ... (Modal components remain the same) */}
        </Layout>
    );
}

export default App;