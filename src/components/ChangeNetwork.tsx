// React + Web3 Essentials
import { useWeb3React } from '@web3-react/core';
import { utils } from "ethers";
import React from "react";

// External Packages
import { MdCheckCircle, MdError } from "react-icons/md";
import styled, { useTheme } from "styled-components";

// Internal Components
import useToast from "hooks/useToast";
import { Button, Item, Span } from "../primaries/SharedStyling";
import { aliasChainIdsMapping, CORE_CHAIN_ID, NETWORK_DETAILS, networkName } from "helpers/UtilityHelper";
import { CHAIN_DETAILS } from 'config';

const ChangeNetwork = () => {
  const changeNetworkToast = useToast();
  const themes = useTheme();
  const { chainId, library } = useWeb3React();

  const switchToPolygonNetwork = async (chainId: number, provider: any) => {
    const polygonChainId = aliasChainIdsMapping[chainId];

    try {
      changeNetworkToast.showLoaderToast({ loaderMessage: "Waiting for Confirmation..."});

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: utils.hexValue(polygonChainId) }],
      });

      changeNetworkToast.showMessageToast({
        toastTitle:"Success", 
        toastMessage: `Successfully switched to ${networkName[polygonChainId]} !`, 
        toastType: "SUCCESS", 
        getToastIcon: (size) => <MdCheckCircle size={size} color="green" />
    })
    } catch (switchError) {
      changeNetworkToast.showMessageToast({
        toastTitle:"Error", 
        toastMessage: `There was an error switching Chain ( ${switchError.message} )`, 
        toastType:  "ERROR", 
        getToastIcon: (size) => <MdError size={size} color="red" />
    })

      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_DETAILS[CHAIN_DETAILS[polygonChainId].name]],
          });
        } catch (addError) {
          console.error(`Unable to add ${networkName[polygonChainId]} Network in wallet`);
        }
      }
      // error toast - Your wallet doesn't support switch network. Kindly, switch the network to Polygon manually.
      changeNetworkToast.showMessageToast({
        toastTitle:"Error", 
        toastMessage: `Your wallet doesn't support switching chains. Kindly, switch the network to ${networkName[polygonChainId]} manually.( ${switchError.message} )`, 
        toastType:  "ERROR", 
        getToastIcon: (size) => <MdError size={size} color="red" />
    })
      console.error("Unable to switch chains");
    }
  }

  return (
    <Item
      margin="15px 20px 15px 20px"
      flex="1"
      display="flex"
      direction="column"
    >
      <Span
        textAlign="center"
        margin="60px 0px 0px 0px"
        color={themes.color}
        size="16px"
        textTransform="none"
        weight="500"
        line="24px"
      >
        Change your wallet network to <TextPink>{networkName[aliasChainIdsMapping[CORE_CHAIN_ID]]}</TextPink> to
        start <br></br>
        verifying your Channel Alias.
      </Span>

      <Item
        width="12.2em"
        self="stretch"
        align="stretch"
        margin="100px auto 50px auto"
      >
        <Button
          bg="#e20880"
          color="#fff"
          flex="1"
          radius="15px"
          padding="20px 20px"
          onClick={() => switchToPolygonNetwork(chainId, library.provider)}
        >
          <Span
            color="#fff"
            weight="600"
            textTransform="none"
            line="22px"
            size="16px"
          >
            Change Network
          </Span>
        </Button>
      </Item>
    </Item>
  );
};

const TextPink = styled.b`
  color: #cf1c84;
`;

export default ChangeNetwork;
