import { expect } from 'chai'
import { HdKeyring } from '../../src/keyring'
const sampleMnemonic =
	'finish oppose decorate face calm tragic certain desk hour urge dinosaur mango'
const firstPrivateKey =
	'69f477943dd1591f0261cabade0839e2ffc0c13d8fa1ce0d69f6c6c251163b34'
const firstAccount =
	'025d7c14ab260a6932bc5484a0d9791f5cce66b0c6e1e4d7aee1e6bd294459e7d9'
const secondAccount =
	'0306cd1266c7dfc5522d1f170fa45cca29a7071a5dad848204b676cbd398aa7d30'
describe('bitcoin-hd-keyring', () => {
	describe('constructor', () => {
		it('constructs with a typeof string mnemonic', async () => {
			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
			})
			const accounts = await keyring.getAccounts()
			expect(accounts[0]).eq(firstAccount)
			expect(accounts[1]).eq(secondAccount)
			const privateKey = await keyring.exportAccount(accounts[0])
			expect(privateKey).eq(firstPrivateKey)
		})
	})

	describe('re-initialization protection', () => {
		const alreadyProvidedError =
			'Btc-Hd-Keyring: Secret recovery phrase already provided'
		it('double generateRandomMnemonic', async () => {
			const keyring = new HdKeyring()
			await keyring.initFromMnemonic(sampleMnemonic)

			let error = ''
			try {
				await keyring.initFromMnemonic(sampleMnemonic)
			} catch (e) {
				error = e.message
			}
			expect(error).eq(alreadyProvidedError)
		})

		it('constructor + generateRandomMnemonic', async () => {
			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
			})

			let error = ''
			try {
				await keyring.initFromMnemonic(sampleMnemonic)
			} catch (e) {
				error = e.message
			}
			expect(error).eq(alreadyProvidedError)
		})
	})

	describe('Keyring.type', () => {
		it('is a class property that returns the type string.', () => {
			const { type } = HdKeyring
			expect(typeof type).eq('string')
		})
	})

	describe('#type', () => {
		it('returns the correct value', () => {
			const keyring = new HdKeyring()

			const { type } = keyring
			const correct = HdKeyring.type
			expect(type).eq(correct)
		})
	})

	describe('#Change hdPath', () => {
		it('pass m/44', async () => {
			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
				hdPath: "m/44'/0'/0'/0",
			})

			const accounts_m44 = await keyring.getAccounts()
			expect(accounts_m44).deep.equal([
				'025d7c14ab260a6932bc5484a0d9791f5cce66b0c6e1e4d7aee1e6bd294459e7d9',
				'0306cd1266c7dfc5522d1f170fa45cca29a7071a5dad848204b676cbd398aa7d30',
			])
		})

		it('pass m/84', async () => {
			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
				hdPath: "m/84'/0'/0'/0",
			})

			const accounts_m84 = await keyring.getAccounts()
			expect(accounts_m84).deep.equal([
				'02d16db9d525d8623e80c04e33c4463450285791124381bc545bb85e5e8925a776',
				'023f0b3115a6c5a51ec62d8cbe6e834e79fe4bf22555e095a163e0e451a6fdc4d5',
			])
		})

		it('change m/44 to m/84', async () => {
			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
				hdPath: "m/44'/0'/0'/0",
			})

			keyring.changeHdPath("m/84'/0'/0'/0")
			const accounts_m84 = await keyring.getAccounts()
			expect(accounts_m84).deep.equal([
				'02d16db9d525d8623e80c04e33c4463450285791124381bc545bb85e5e8925a776',
				'023f0b3115a6c5a51ec62d8cbe6e834e79fe4bf22555e095a163e0e451a6fdc4d5',
			])
		})

		it('getAccountByHdPath', async () => {
			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
				hdPath: "m/44'/0'/0'/0",
			})

			const account = keyring.getAccountByHdPath("m/84'/0'/0'/0", 1)
			expect(account).eq(
				'023f0b3115a6c5a51ec62d8cbe6e834e79fe4bf22555e095a163e0e451a6fdc4d5'
			)
		})
	})

	describe('more words test', () => {
		it('12 words', async () => {
			const sampleMnemonic =
				'glue peanut huge wait vicious depend copper ribbon access boring walk point'
			const firstAccount =
				'0244ffe4b9f87b7c1e2f8b0d7dee2a91492fedf9c92fc06231764826633b2c8afa'
			const secondAccount =
				'0243906ea96ce2680826bfd906cdfcbb70cf2764e469518ba000f0aeb76a6b025b'

			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
			})

			const accounts = await keyring.getAccounts()
			expect(accounts[0]).eq(firstAccount)
			expect(accounts[1]).eq(secondAccount)
		})

		it('15 words', async () => {
			const sampleMnemonic =
				'gloom prepare pause lazy item valley pear develop ahead crucial fuel seed bone reward shoot'
			const firstAccount =
				'02c7b966f5ea72f65c3c3e218103d08c3f259b21cc99d846754e2ca766eb1afd85'
			const secondAccount =
				'02dea555ea75823e76c2b7589bdbc601ef4eb26742be5f096bc31319367873101b'

			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
			})

			const accounts = await keyring.getAccounts()
			expect(accounts[0]).eq(firstAccount)
			expect(accounts[1]).eq(secondAccount)
		})

		it('18 words', async () => {
			const sampleMnemonic =
				'machine chest second galaxy rally design stumble code address general twelve job code acquire dutch debate jealous truly'
			const firstAccount =
				'02d9bf4d71d15e941fb060f58e74c53995761a381d2e368062687c1ef65bb52a84'
			const secondAccount =
				'03d1b536f6f18eb1ffea8227987a1a80072a316c3d0bfedc2af01b21ece5b7492e'

			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
			})

			const accounts = await keyring.getAccounts()
			expect(accounts[0]).eq(firstAccount)
			expect(accounts[1]).eq(secondAccount)
		})

		it('21 words', async () => {
			const sampleMnemonic =
				'squirrel spawn fog zero approve connect mirror social basic about alert yellow giraffe oak company file finger winner coast cushion oxygen'
			const firstAccount =
				'02deda9f6759511ac3b00bd685871cf5b658dc082db39ba7dfeb394134cddc5537'
			const secondAccount =
				'031c90977662ae1c7ab0082940307a0a82d34bdba9c26b38404402676e99484b9e'

			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
			})

			const accounts = await keyring.getAccounts()
			expect(accounts[0]).eq(firstAccount)
			expect(accounts[1]).eq(secondAccount)
		})

		it('24 words', async () => {
			const sampleMnemonic =
				'dash pair decline scrap federal marine erase lounge fancy quick valid crawl wing ahead art chaos deposit rare deputy gaze often fence alien picture'
			const firstAccount =
				'03111f9a4b905f058d0fb0cbc968f2e8d3796d8e6a2308b90069477a5a0be09b01'
			const secondAccount =
				'03e514ed9ec10e4df0b134d0728abf5746ace056230e12d3e9cce8fe669d74a532'

			const keyring = new HdKeyring({
				mnemonic: sampleMnemonic,
				activeIndexes: [0, 1],
			})

			const accounts = await keyring.getAccounts()
			expect(accounts[0]).eq(firstAccount)
			expect(accounts[1]).eq(secondAccount)
		})
	})

	describe('support xpriv', () => {
		it('xpriv', async () => {
			const sampleXpriv =
				'xprvA2JBuYsdqVhrC2wGmb9QhBejk9gXXYgM3Jg9xgVYmDMsakDoURc8V7UYos1pP1kev1tG51PPA9A8VMYYCLov1L5c3J7npraxwjeJCquGhDi'
			const firstAccount =
				'0244ffe4b9f87b7c1e2f8b0d7dee2a91492fedf9c92fc06231764826633b2c8afa'
			const secondAccount =
				'0243906ea96ce2680826bfd906cdfcbb70cf2764e469518ba000f0aeb76a6b025b'

			const keyring = new HdKeyring({
				xpriv: sampleXpriv,
				activeIndexes: [0, 1],
			})

			const accounts = await keyring.getAccounts()
			expect(accounts[0]).eq(firstAccount)
			expect(accounts[1]).eq(secondAccount)
		})
	})
})
