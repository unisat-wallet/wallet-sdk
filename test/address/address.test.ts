import { expect } from 'chai'
import { AddressType } from '../../src'
import {
	decodeAddress,
	getAddressType,
	isValidAddress,
	publicKeyToAddress,
} from '../../src/address'
import { NetworkType } from '../../src/network'
import { LocalWallet } from '../../src/wallet'

const p2wpkh_data = {
	pubkey: '02b602ad190efb7b4f520068e3f8ecf573823d9e2557c5229231b4e14b79bbc0d8',
	mainnet_address: 'bc1qq2z2wssazy76tfpucdd32r78xe7urcj2rtlnkw',
	testnet_address: 'tb1qq2z2wssazy76tfpucdd32r78xe7urcj2fdyqda',
}

const p2sh_data = {
	pubkey: '020690457248a4f4f3ba2568b88a252af0d9dcfd9e0394690cbb0d45f72c574ee6',
	mainnet_address: '3ESTprj6AdpfGEFgDMri4f2iSf9YutNjXP',
	testnet_address: '2N5zftbf7n6L1U1tDtVUagc1yf1Mig123D2',
}

const p2tr_data = {
	pubkey: '0333bc88101f32b7ba799504d9340e77aedcf0ea3a047131737e5eb4e5bee23406',
	mainnet_address:
		'bc1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uqd2mk58',
	testnet_address:
		'tb1p8wat4p7077p3k6waauz0pjryywfxly35uz74ve9usp4jp6mk04uq6zdewg',
}

const p2pkh_data = {
	pubkey: '025e8ae8f7d9891dc0e24a4c1e74b58570281d4d3da8a3240268e00f0faa5d74b9',
	mainnet_address: '1JRtSjhQqt2qCRYN7jtqNUwTgn7uwagUpc',
	testnet_address: 'mxwqjnnPeuU5yY1yqJsDCQ9nYmicmGTBns',
}

const raw_p2tr_data = {
	pubkey: '02a276a2f72b2581bbb325c9d51714bd65686a9af95d7df4d625b711d7203fd7ac',
	mainnet_address: 'bc1p5fm29aetykqmhve9e823w99av45x4xhet47lf439kugawgpl67kqtgzm0z',
}

const invalid_data = {
	pubkey: '',
	mainnet_address: '',
	testnet_address: '',
}

describe('address', function () {
	it('test function publicKeyToAddress', async function () {
		expect(
			publicKeyToAddress(
				p2wpkh_data.pubkey,
				AddressType.P2WPKH,
				NetworkType.MAINNET
			)
		).eq(p2wpkh_data.mainnet_address, 'pubkey->p2wpkh mainnet')

		expect(
			publicKeyToAddress(
				p2wpkh_data.pubkey,
				AddressType.P2WPKH,
				NetworkType.TESTNET
			)
		).eq(p2wpkh_data.testnet_address, 'pubkey->p2wpkh testnet')

		expect(
			publicKeyToAddress(
				p2sh_data.pubkey,
				AddressType.P2SH_P2WPKH,
				NetworkType.MAINNET
			)
		).eq(p2sh_data.mainnet_address, 'pubkey->p2sh mainnet')

		expect(
			publicKeyToAddress(
				p2sh_data.pubkey,
				AddressType.P2SH_P2WPKH,
				NetworkType.TESTNET
			)
		).eq(p2sh_data.testnet_address, 'pubkey->p2sh testnet')

		expect(
			publicKeyToAddress(
				p2tr_data.pubkey,
				AddressType.P2TR,
				NetworkType.MAINNET
			)
		).eq(p2tr_data.mainnet_address, 'pubkey->p2tr mainnet')

		expect(
			publicKeyToAddress(
				p2tr_data.pubkey,
				AddressType.P2TR,
				NetworkType.TESTNET
			)
		).eq(p2tr_data.testnet_address, 'pubkey->p2tr testnet')

		expect(
			publicKeyToAddress(
				p2pkh_data.pubkey,
				AddressType.P2PKH,
				NetworkType.MAINNET
			)
		).eq(p2pkh_data.mainnet_address, 'pubkey->p2pkh mainnet')

		expect(
			publicKeyToAddress(
				p2pkh_data.pubkey,
				AddressType.P2PKH,
				NetworkType.TESTNET
			)
		).eq(p2pkh_data.testnet_address, 'pubkey->p2pkh testnet')

		expect(
			publicKeyToAddress(
				raw_p2tr_data.pubkey,
				AddressType.RAW_P2TR,
				NetworkType.MAINNET
			)
		).eq(raw_p2tr_data.mainnet_address, 'pubkey->raw_p2tr mainnet')
	})
	it('test function isValidAddress', async function () {
		expect(
			isValidAddress(p2wpkh_data.mainnet_address, NetworkType.MAINNET)
		).eq(true, 'p2wpkh mainnet address of mainnet should be valid')
		expect(
			isValidAddress(p2wpkh_data.testnet_address, NetworkType.TESTNET)
		).eq(true, 'p2wpkh testnet address of testnet should be invalid')
		expect(
			isValidAddress(p2sh_data.mainnet_address, NetworkType.MAINNET)
		).eq(true, 'p2sh mainnet address of mainnet should be valid')
		expect(
			isValidAddress(p2sh_data.testnet_address, NetworkType.TESTNET)
		).eq(true, 'p2sh testnet address of testnet should be valid')
		expect(
			isValidAddress(p2tr_data.mainnet_address, NetworkType.MAINNET)
		).eq(true, 'p2tr mainnet address of mainnet should be valid')
		expect(
			isValidAddress(p2tr_data.testnet_address, NetworkType.TESTNET)
		).eq(true, 'p2tr testnet address of testnet should be valid')
		expect(
			isValidAddress(p2pkh_data.mainnet_address, NetworkType.MAINNET)
		).eq(true, 'p2pkh mainnet address of mainnet should be valid')
		expect(
			isValidAddress(p2pkh_data.testnet_address, NetworkType.TESTNET)
		).eq(true, 'p2pkh testnet address of testnet should be valid')
		expect(
			isValidAddress(p2pkh_data.mainnet_address, NetworkType.TESTNET)
		).eq(false, 'p2pkh mainnet address of testnet should be invalid')
		expect(
			isValidAddress(p2pkh_data.testnet_address, NetworkType.MAINNET)
		).eq(false, 'p2pkh testnet address of mainnet should be invalid')
		expect(
			isValidAddress(invalid_data.mainnet_address, NetworkType.MAINNET)
		).eq(false, 'invalid mainnet address of mainnet should be invalid')
	})

	it('getAddressType', () => {
		expect(
			getAddressType(p2wpkh_data.mainnet_address, NetworkType.MAINNET)
		).eq(AddressType.P2WPKH, 'mainnet address type should be p2wpkh')

		expect(
			getAddressType(p2wpkh_data.testnet_address, NetworkType.TESTNET)
		).eq(AddressType.P2WPKH, 'testnet address type should be p2wpkh')

		expect(
			getAddressType(p2pkh_data.mainnet_address, NetworkType.MAINNET)
		).eq(AddressType.P2PKH, 'mainnet address type should be p2pkh')

		expect(
			getAddressType(p2pkh_data.testnet_address, NetworkType.TESTNET)
		).eq(AddressType.P2PKH, 'testnet address type should be p2pkh')

		expect(
			getAddressType(p2tr_data.mainnet_address, NetworkType.MAINNET)
		).eq(AddressType.P2TR, 'mainnet address type should be p2tr')

		expect(
			getAddressType(p2tr_data.testnet_address, NetworkType.TESTNET)
		).eq(AddressType.P2TR, 'testnet address type should be p2tr')

		// TODO: P2SH OR P2SH_P2WPKH?
		expect(
			getAddressType(p2sh_data.mainnet_address, NetworkType.MAINNET)
		).eq(AddressType.P2SH_P2WPKH, 'mainnet address type should be p2sh')

		expect(
			getAddressType(p2sh_data.testnet_address, NetworkType.TESTNET)
		).eq(AddressType.P2SH_P2WPKH, 'testnet address type should be p2sh')
	})

	const networks = [
		NetworkType.MAINNET,
		NetworkType.TESTNET,
		// NetworkType.REGTEST, not support
	]
	const networkNames = ['MAINNET', 'TESTNET', 'REGTEST']
	networks.forEach((networkType) => {
		describe(
			'decodeAddress networkType: ' + networkNames[networkType],
			function () {
				const addressTypes = [
					AddressType.P2TR,
					AddressType.P2WPKH,
					AddressType.P2PKH,
					AddressType.P2SH_P2WPKH,
				]
				const dusts = [330, 294, 546, 546]
				addressTypes.forEach((addressType, index) => {
					it(`should return ${networkNames[networkType]}`, function () {
						const address = LocalWallet.fromRandom(
							addressType,
							networkType
						).address
						const addressInfo = decodeAddress(address)
						expect(addressInfo.networkType).to.eq(networkType)
						expect(addressInfo.addressType).to.eq(addressType)
						expect(addressInfo.dust).to.eq(dusts[index])
					})
				})
			}
		)
	})

	it('decodeAddress UNKNOWN', function () {
		expect(decodeAddress('invalid address').addressType).eq(
			AddressType.UNKNOWN
		)

		expect(decodeAddress('bc1qxxx').addressType).eq(AddressType.UNKNOWN)

		expect(decodeAddress('').addressType).eq(AddressType.UNKNOWN)
	})
})
