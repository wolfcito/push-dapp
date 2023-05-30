import { Image, P } from 'components/SharedStyling';
import { ButtonV2, H2V2, ItemHV2, ItemVV2, SpanV2 } from 'components/reusables/SharedStylingV2';
import React, { useState } from 'react';
import { useClickAway } from 'react-use';
import styled from 'styled-components';
import { ReactComponent as Close } from 'assets/chat/group-chat/close.svg';
import { Input, Span } from 'primaries/SharedStyling';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { abis, addresses } from 'config';
import { MdCheckCircle, MdError } from 'react-icons/md';
import LoaderSpinner, { LOADER_TYPE } from 'components/reusables/loaders/LoaderSpinner';
import { bn, bnToInt, formatTokens } from 'helpers/StakingHelper';

const StakingModalComponent = ({ onClose, InnerComponentProps, toastObject }) => {

    const {
        title,
        getUserData,
        getPoolStats
    } = InnerComponentProps;

    const { account, library } = useWeb3React();

    const [maxAmount, setMaxAmount] = useState(0);
    const [approvedToken, setApprovedToken] = useState(0);
    const [depositApproved, setDepositApprove] = React.useState(false);

    const [txInProgressApprDep, setTxInProgressApprDep] = React.useState(false);
    const [txInProgressDep, setTxInProgressDep] = React.useState(false);

    const [depositAmount, setDepositAmount] = useState(0);

    const handleClose = () => onClose();
    const containerRef = React.useRef(null);
    useClickAway(containerRef, () => handleClose());

    const fillMax = async () => {
        var signer = library.getSigner(account);
        const tokenAddr = title === 'Uni-V2' ? addresses.uniV2LPToken : addresses.pushToken;
        const token = new ethers.Contract(tokenAddr, abis.uniV2LpToken, signer);

        let balance = bnToInt(await token.balanceOf(account));
        setMaxAmount(parseInt(balance.toString().replace(/\D/, '')) || 0);

    }

    const checkApprDeposit = async () => {
        setTxInProgressApprDep(true);

        var signer = library.getSigner(account);
        let allowance;

        if (title === 'Uni-V2') {
            let token = new ethers.Contract(addresses.uniV2LPToken, abis.uniV2LpToken, signer);
            allowance = await token.allowance(account, addresses.stakingV2);
        } else {
            let token = new ethers.Contract(addresses.pushToken, abis.uniV2LpToken, signer);
            allowance = await token.allowance(account, addresses.pushCoreV2);
        }

        setApprovedToken(formatTokens(allowance));
        setTxInProgressApprDep(false);
    }

    React.useEffect(() => {
        fillMax();
        checkApprDeposit();
    }, [])

    const approveDeposit = async () => {
        if (depositApproved || txInProgressApprDep) {
            return
        }

        setTxInProgressApprDep(true);

        var signer = library.getSigner(account);


        let tx;
        const uintMax = bn(2).pow(bn(256)).sub(1);

        if (title === 'Uni-V2') {
            const tokencontractinstance = new ethers.Contract(addresses.uniV2LPToken, abis.uniV2LpToken, signer);
            tx = tokencontractinstance.approve(
                addresses.stakingV2,
                uintMax
            );
        } else {
            const tokencontractinstance = new ethers.Contract(addresses.pushToken, abis.uniV2LpToken, signer);
            tx = tokencontractinstance.approve(
                addresses.pushCoreV2,
                uintMax
            )
        }

        tx.then(async (tx) => {
            toastObject.showLoaderToast({ loaderMessage: 'Waiting for Confirmation...' });
            try {
                await library.waitForTransaction(tx.hash);
                toastObject.showMessageToast({
                    toastTitle: 'Success',
                    toastMessage: `Successfully approved ${title} Tokens!`,
                    toastType: 'SUCCESS',
                    getToastIcon: (size) => (
                        <MdCheckCircle
                            size={size}
                            color="green"
                        />
                    ),
                });

                setTxInProgressApprDep(false);
                setDepositApprove(true);

            } catch (e) {
                console.log("Error", e);
                toastObject.showMessageToast({
                    toastTitle: 'Error',
                    toastMessage: `User denied message signature.`,
                    toastType: 'ERROR',
                    getToastIcon: (size) => <MdError size={size} color="red" />,
                });

                setTxInProgressApprDep(false);
            }
        }).catch((err) => {
            console.log("Error", err);
            toastObject.showMessageToast({
                toastTitle: 'Error',
                toastMessage: `User denied message signature`,
                toastType: 'ERROR',
                getToastIcon: (size) => <MdError size={size} color="red" />,
            });
            setTxInProgressApprDep(false);
        });
    }

    const depositAmountTokenFarmSingleTx = async () => {
        if (txInProgressDep || !depositApproved) {
            return
        }

        setTxInProgressDep(true)

        var signer = library.getSigner(account);

        let tx2;

        if (title === 'Uni-V2') {
            let staking = new ethers.Contract(addresses.stakingV2, abis.stakingV2, signer);

            tx2 = staking.deposit(
                addresses.uniV2LPToken,
                ethers.BigNumber.from(depositAmount).mul(
                    ethers.BigNumber.from(10).pow(18)
                )
            );

        } else {
            let pushCoreV2 = new ethers.Contract(addresses.pushCoreV2, abis.pushCoreV2, signer);

            tx2 = pushCoreV2.stake(
                ethers.BigNumber.from(depositAmount).mul(
                    ethers.BigNumber.from(10).pow(18)
                )
            )
        }

        tx2
            .then(async (tx) => {
                toastObject.showLoaderToast({ loaderMessage: 'Waiting for Confirmation...' });


                try {
                    await library.waitForTransaction(tx.hash);
                    toastObject.showMessageToast({
                        toastTitle: 'Success',
                        toastMessage: 'Transaction Completed!',
                        toastType: 'SUCCESS',
                        getToastIcon: (size) => (
                            <MdCheckCircle
                                size={size}
                                color="green"
                            />
                        ),
                    });

                    getPoolStats();
                    getUserData();
                    setTxInProgressDep(false);
                    handleClose();

                } catch (e) {
                    console.log("Error", e)
                    toastObject.showMessageToast({
                        toastTitle: 'Error',
                        toastMessage: `Transaction Failed! (" +${e.name}+ ")`,
                        toastType: 'ERROR',
                        getToastIcon: (size) => <MdError size={size} color="red" />,
                    });

                    setTxInProgressDep(false);
                }
            })
            .catch((err) => {
                toastObject.showMessageToast({
                    toastTitle: 'Error',
                    toastMessage: `Transaction Cancelled!`,
                    toastType: 'ERROR',
                    getToastIcon: (size) => <MdError size={size} color="red" />,
                });

                setTxInProgressDep(false);
            });
    };

    const handleInput = (e) => {
        e.preventDefault();
        setDepositAmount(parseInt(e.target.value.replace(/\D/, '')) || 0)

        if (approvedToken >= parseInt(e.target.value.replace(/\D/, '')) || 0) {
            setDepositApprove(true);
        }
        else {
            setDepositApprove(false);
        }
    }

    const setDepositAmountMax = (tokenAmount) => {
        setDepositAmount(parseInt(tokenAmount.toString().replace(/\D/, '')) || 0)
    }


    return (
        <Container>

            <ItemHV2 justifyContent='space-between'>
                <PrimaryText>{title === 'Uni-V2' ? 'Uniswap V2 Staking Pool' : 'Push Fee staking Pool'}</PrimaryText>
                <Close
                    onClick={() => handleClose()}
                    style={{ cursor: 'pointer' }}
                />
            </ItemHV2>

            <ItemVV2>
                <P weight='500' size='14px' self='baseline'>You are staking</P>


                <ItemHV2 background='#F4F5FA' height='35px' padding='14px' borderRadius='12px'>
                    <TokenInput
                        placeholder="0"
                        flex='2'
                        radius="4px"
                        size='32px'
                        height='32px'
                        self="auto"
                        bg='#F4F5FA'
                        value={depositAmount}
                        onChange={(e) => {
                            e.preventDefault();
                            handleInput(e);
                        }}
                        autoFocus={true}
                    />

                    <MaxText onClick={() => setDepositAmountMax(maxAmount)}>Max: {maxAmount}</MaxText>

                </ItemHV2>

            </ItemVV2>

            <ItemHV2 margin='20px 0'>

                <FilledButton
                    onClick={approveDeposit}
                    bg={depositApproved ? "#999" : "#e20880"}
                    disabled={depositApproved ? true : false}>

                    {!depositApproved && !txInProgressApprDep &&
                        <Span color="#fff" weight="400" cursor='pointer'>Approve {title}</Span>
                    }
                    {txInProgressApprDep && !depositApproved &&
                        <LoaderSpinner type={LOADER_TYPE.SEAMLESS} spinnerSize={26} spinnerColor="#fff" />
                    }
                    {depositApproved &&
                        <Span color="#fff" weight="600">Approved</Span>
                    }

                </FilledButton>
                <EmptyButton background={!depositApproved ? "#999" : "#ffffff"}
                    disabled={!depositApproved ? true : false} onClick={depositAmountTokenFarmSingleTx}>
                    
                    {!txInProgressDep &&
                        <Span color="#657795" weight="400" cursor='pointer'>Deposit</Span>
                    }

                    {txInProgressDep &&
                        <LoaderSpinner type={LOADER_TYPE.SEAMLESS} spinnerSize={26} spinnerColor="#D53A94" />
                    }

                </EmptyButton>

            </ItemHV2>

        </Container>
    );
};

export default StakingModalComponent;

const Container = styled.div`
    padding:16px 20px;
    width: 340px;
    font-family: 'Strawford';
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
`

const PrimaryText = styled(H2V2)`
    
    font-size: 16px;
    letter-spacing: -0.019em;
    color: #333333;
`

const TokenInput = styled(Input)``

const MaxText = styled.p`
    font-size: 14px;
    text-align: right;
    text-decoration-line: underline;
    color: #657795;
    margin:0px;
    cursor:pointer;
`

const FilledButton = styled(ButtonV2)`
    width:100%;
    background: #D53A94;
    border: 1px solid #D53A94;
    border-radius: 8px;
    padding: 12px;
    font-size: 18px;
    line-height: 141%;
    letter-spacing: -0.03em;
    color: #FFFFFF;
    cursor:pointer;
    width: 145px;
    height: 48px;
    & > div{
        display:block;
    }
    
`;

const EmptyButton = styled.button`
    // padding: 16px;
    background:#ffffff;
    font-size: 16px;
    line-height: 19px;
    flex:1;
    cursor:pointer;
    width: 145px;
    height: 48px;
    border: 1px solid #657795;
    border-radius: 8px;
    color: #657795;
    margin-left: 10px;
    & > div{
        display:block;
    }

    &:hover{
        background: #e3e3e3;
        opacity:1;
    }

    

`
