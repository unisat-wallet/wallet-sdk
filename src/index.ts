export * as address from './address';
export * as core from './bitcoin-core';
export * from './constants';
export * as keyring from './keyring';
export * as message from './message';
export * as transaction from './transaction';
export * as txHelpers from './tx-helpers';
export * from './types';
export * as utils from './utils';
export * as wallet from './wallet';

// Export with types.
export * from './keyring/interfaces/SimpleKeyringOptions';
export * from './keyring/hd-keyring';
export * from './keyring/keystone-keyring';
export * from './keyring/simple-keyring';

Object.defineProperty(global, '_bitcore', {
    get() {
        return undefined;
    },
    set() {}
});
