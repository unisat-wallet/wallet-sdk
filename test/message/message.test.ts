import { expect } from 'chai';
import { AddressType } from '../../src';
import { verifyMessageOfBIP322Simple, verifyMessageOfECDSA } from '../../src/message';
import { NetworkType } from '../../src/network';
import { LocalWallet } from '../../src/wallet';
import { expectThrowError } from '../utils';

describe('verifyMessage', function () {
    it('ecdsa', async function () {
        const message = 'hello world~';
        const wallet = LocalWallet.fromRandom();
        const signature = await wallet.signMessage(message, 'ecdsa');
        const pubkey = await wallet.getPublicKey();
        const result = await verifyMessageOfECDSA(pubkey, message, signature);
        expect(result).eq(true);

        const errorResult = await verifyMessageOfECDSA(
            pubkey,
            message,
            'G6nd7IqQaU8kxNbUDCnGLf+lA5ZxJ9TVlNOoNSuQ6j1yD1lG/Y25h01yT7SNxW56IuGNRX8Eu4baQYzhU78Wa0o='
        );
        expect(errorResult).eq(false);
    });

    it('bip322-simple for P2WPKH', async function () {
        const message = 'hello world~';
        const wallet = LocalWallet.fromRandom(AddressType.P2WPKH);
        const signature = await wallet.signMessage(message, 'bip322-simple');
        const result = verifyMessageOfBIP322Simple(wallet.address, message, signature);
        expect(result).eq(true);
    });

    it('bip322-simple for P2TR', async function () {
        const message = 'hello world~';
        const wallet = LocalWallet.fromRandom(AddressType.P2TR);
        const signature = await wallet.signMessage(message, 'bip322-simple');
        const result = verifyMessageOfBIP322Simple(wallet.address, message, signature);
        expect(result).eq(true);
    });

    it('bip322-simple for P2PKH', async function () {
        const message = 'hello world~';
        const wallet = LocalWallet.fromRandom(AddressType.P2PKH);
        await expectThrowError(() => wallet.signMessage(message, 'bip322-simple'), 'Not support address type to sign');
    });

    // https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
    it('pass the example1 in bip-0322.mediawiki', async function () {
        const message = '';
        const wallet = new LocalWallet(
            'L3VFeEujGtevx9w18HD1fhRbCH67Az2dpCymeRE1SoPK6XQtaN2k',
            AddressType.P2WPKH,
            NetworkType.MAINNET
        );
        const signature =
            'AkcwRAIgM2gBAQqvZX15ZiysmKmQpDrG83avLIT492QBzLnQIxYCIBaTpOaD20qRlEylyxFSeEA2ba9YOixpX8z46TSDtS40ASECx/EgAxlkQpQ9hYjgGu6EBCPMVPwVIVJqO4XCsMvViHI=';
        const result = verifyMessageOfBIP322Simple(wallet.address, message, signature);
        expect(result).eq(true);
    });

    it('pass the example2 in bip-0322.mediawiki', async function () {
        const message = 'Hello World';
        const wallet = new LocalWallet(
            'L3VFeEujGtevx9w18HD1fhRbCH67Az2dpCymeRE1SoPK6XQtaN2k',
            AddressType.P2WPKH,
            NetworkType.MAINNET
        );
        const signature =
            'AkcwRAIgZRfIY3p7/DoVTty6YZbWS71bc5Vct9p9Fia83eRmw2QCICK/ENGfwLtptFluMGs2KsqoNSk89pO7F29zJLUx9a/sASECx/EgAxlkQpQ9hYjgGu6EBCPMVPwVIVJqO4XCsMvViHI=';
        const result = verifyMessageOfBIP322Simple(wallet.address, message, signature);
        expect(result).eq(true);
    });

    it('same with unisat wallet 1.1.33', async function () {
        const message = 'hello';
        const wallet = new LocalWallet(
            'L3VFeEujGtevx9w18HD1fhRbCH67Az2dpCymeRE1SoPK6XQtaN2k',
            AddressType.P2TR,
            NetworkType.MAINNET
        );

        const signature_now = await wallet.signMessage(message, 'bip322-simple');
        //const signature_old = 'AUCNuph9ZfpmxxVZozX4jVUYDXU3rR481/id9sQRUYTwdYWiLUE1cftTK2chYJENB0eYCLPykIC4Zi+U4DQ9zqew';
        const signature_old =
            'AUBRZJdM1Lhd3AaOOiWOLe1wO+qE7Ly4Dkq2Kfz+QSBwN1O4ITEfH50RywVolNhKAg7Z6/eeTyxHBzLBotPlq7NS';

        expect(signature_now).eq(signature_old);
    });

    it('deterministic ecdsa', async function () {
        const message = 'hello';
        const wallet = new LocalWallet(
            'L3VFeEujGtevx9w18HD1fhRbCH67Az2dpCymeRE1SoPK6XQtaN2k',
            AddressType.P2TR,
            NetworkType.MAINNET
        );
        const signature = await wallet.signMessage(message, 'ecdsa');
        const pubkey = await wallet.getPublicKey();
        const result = await verifyMessageOfECDSA(pubkey, message, signature);
        expect(result).eq(true);
        expect(signature).eq(
            'IAR9YCVMTeNIGzStagcrMfAJI0ehg8QT4dULe8n25Tw8VFo+15jgNRrzY282xGu7fnpmpQVKdi7d9evDBUkUpwk='
        );
    });
});
