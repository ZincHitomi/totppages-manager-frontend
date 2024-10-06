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

const {Header, Content, Footer, Sider} = Layout;
const {Dragger} = Upload;
const {Text} = Typography;

// ... CountdownTimer component remains unchanged ...

function App() {
    // ... existing state declarations remain unchanged ...

    const isDesktopOrLaptop = useMediaQuery({minWidth: 1024});
    const isTablet = useMediaQuery({minWidth: 768, maxWidth: 1023});
    const isMobile = useMediaQuery({maxWidth: 767});

    // ... existing useEffect and function declarations remain unchanged ...

    const getResponsiveTableColumns = useCallback(() => {
        const baseColumns = [
            {
                title: '序号',
                key: 'index',
                render: (text, record, index) => index + 1,
                width: isMobile ? 50 : 80,
            },
            {
                title: '用户信息',
                dataIndex: 'userInfo',
                key: 'userInfo',
                ellipsis: true,
            },
        ];

        if (!isMobile) {
            baseColumns.push({
                title: '密钥',
                dataIndex: 'secret',
                key: 'secret',
                render: (text) => text && text.length > 0 ? <Text copyable>{formatSecret(text)}</Text> : '已清空',
                ellipsis: true,
            });
        }

        baseColumns.push({
            title: '令牌',
            key: 'token',
            render: (text, record) => (
                <Space>
                    <Text strong>{tokens[record.id] || '未生成'}</Text>
                    <CountdownTimer onComplete={() => generateToken(record.id)}/>
                </Space>
            ),
        });

        baseColumns.push({
            title: '操作',
            key: 'action',
            render: (text, record) => (
                <Space wrap>
                    <Button onClick={() => generateToken(record.id)} type="primary"
                            size={isMobile ? 'small' : 'middle'}>
                        生成令牌
                    </Button>
                    {!isMobile && (
                        <Button onClick={() => showQRCode(record)} size={isMobile ? 'small' : 'middle'}
                                icon={<QrcodeOutlined/>}>
                            导出
                        </Button>
                    )}
                    <Button onClick={() => deleteTOTP(record.id)} danger size={isMobile ? 'small' : 'middle'}>
                        删除
                    </Button>
                </Space>
            ),
        });

        return baseColumns;
    }, [isMobile, generateToken, showQRCode, deleteTOTP, tokens, formatSecret]);

    const renderInputSection = () => (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12} lg={14} xl={16}>
                <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{width: '100%'}}>
                    <Input
                        placeholder="用户信息"
                        value={userInfo}
                        onChange={(e) => setUserInfo(e.target.value)}
                        style={{width: isMobile ? '100%' : '40%'}}
                    />
                    <Input
                        placeholder="密钥"
                        value={secret}
                        onChange={(e) => setSecret(formatSecret(e.target.value))}
                        style={{width: isMobile ? '100%' : '40%'}}
                    />
                    <Button type="primary" onClick={addTOTP} icon={<PlusOutlined/>}
                            style={{width: isMobile ? '100%' : 'auto'}}>
                        添加
                    </Button>
                </Space>
            </Col>
            <Col xs={24} sm={24} md={12} lg={10} xl={8}>
                <Space direction={isMobile ? 'vertical' : 'horizontal'}
                       style={{width: '100%', justifyContent: 'flex-end'}}>
                    <Switch
                        checked={syncEnabled}
                        onChange={handleSyncToggle}
                        checkedChildren="同步开启"
                        unCheckedChildren="同步关闭"
                    />
                    {syncEnabled && (
                        <>
                            <Button onClick={showBackupModal} icon={<UploadOutlined/>}>上传</Button>
                            <Button onClick={showRestoreModal} icon={<SyncOutlined/>}>恢复</Button>
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
                    >
                        清除所有
                    </Button>
                </Space>
            </Col>
        </Row>
    );

    const renderContent = () => (
        <PageContainer>
            <Card style={{marginTop: 16}}>
                <Space direction="vertical" size="large" style={{width: '100%'}}>
                    {renderInputSection()}
                    <Dragger {...draggerProps}>
                        <p className="ant-upload-drag-icon">
                            <QrcodeOutlined/>
                        </p>
                        <p className="ant-upload-text">点击或拖拽二维码图片到此区域以导入TOTP</p>
                    </Dragger>
                    {importStatus.loading && (
                        <div style={{textAlign: 'center'}}>
                            <Spin tip="正在导入TOTP..."/>
                        </div>
                    )}
                    {importStatus.count > 0 && (
                        <Alert
                            message={`成功导入 ${importStatus.count} 个TOTP`}
                            type="success"
                            showIcon
                        />
                    )}
                    <Table
                        columns={getResponsiveTableColumns()}
                        dataSource={totps}
                        rowKey="id"
                        locale={{emptyText: 'TOTP列表为空'}}
                        pagination={{
                            pageSize: isMobile ? 5 : 10,
                            simple: isMobile
                        }}
                        scroll={{x: true}}
                    />
                </Space>
            </Card>
        </PageContainer>
    );

    return (
        <Layout style={{minHeight: '100vh'}}>
            {isDesktopOrLaptop ? (
                <>
                    <Header style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: isMobile ? '0 10px' : '0 50px'
                    }}>
                        <div className="logo"
                             style={{
                                 color: 'white',
                                 fontSize: isMobile ? '16px' : '18px',
                                 fontWeight: 'bold',
                                 marginRight: isMobile ? '10px' : '20px'
                             }}>
                            TOTP Token Manager
                        </div>
                        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} style={{flex: 1}}>
                            <Menu.Item key="1">主页</Menu.Item>
                        </Menu>
                    </Header>
                    <Content style={{padding: isMobile ? '0 10px' : '0 50px'}}>
                        {renderContent()}
                    </Content>
                </>
            ) : (
                <Layout>
                    <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="lg"
                           collapsedWidth={isMobile ? 0 : 80}>
                        <div className="logo" style={{
                            height: '32px',
                            margin: '16px',
                            background: 'rgba(255, 255, 255, 0.3)'
                        }}/>
                        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>
                            <Menu.Item key="1" icon={<QrcodeOutlined/>}>
                                TOTP管理
                            </Menu.Item>
                        </Menu>
                    </Sider>
                    <Layout>
                        <Header style={{
                            padding: 0,
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Button
                                type="text"
                                icon={collapsed ? <MenuOutlined/> : <MenuOutlined/>}
                                onClick={() => setCollapsed(!collapsed)}
                                style={{
                                    fontSize: '16px',
                                    width: 64,
                                    height: 64,
                                }}
                            />
                            <span style={{fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold'}}>
                                TOTP Token Manager
                            </span>
                        </Header>
                        <Content style={{
                            margin: isMobile ? '16px 8px' : '24px 16px',
                            padding: isMobile ? 16 : 24,
                            minHeight: 280,
                        }}>
                            {renderContent()}
                        </Content>
                    </Layout>
                </Layout>
            )}
            <Footer style={{textAlign: 'center', padding: isMobile ? '10px' : '24px'}}>
                TOTP Token Manager ©{new Date().getFullYear()} Created by Lones
            </Footer>

            {/* Modals remain largely unchanged, just ensure they're responsive */}
            <Modal
                title="TOTP 二维码"
                open={qrModalVisible}
                onCancel={() => setQrModalVisible(false)}
                footer={[
                    <Button key="download" type="primary" onClick={downloadQRCode}>
                        下载二维码
                    </Button>,
                    <Button key="close" onClick={() => setQrModalVisible(false)}>
                        关闭
                    </Button>,
                ]}
                width={isMobile ? '90%' : 520}
            >
                {currentQR ? (
                    <div style={{display: 'flex', justifyContent: 'center'}}>
                        <QRCodeSVG
                            id="qr-code-canvas"
                            value={currentQR}
                            size={isMobile ? 200 : 256}
                            level={'H'}
                            includeMargin={true}
                        />
                    </div>
                ) : (
                    <p>无法生成二维码：未找到有效的 URI</p>
                )}
            </Modal>

            {/* Other modals follow similar responsive patterns */}
        </Layout>
    );
}

export default App;
