import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import { accountAddress, compatibleWallets, connectAccounts, enterWithAccount, retainedAddress } from '../utils/walletConnection';
import './WalletConnection.css';
