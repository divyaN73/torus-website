<template>
  <v-layout wrap class="wallet-transfer" :class="$vuetify.breakpoint.xsOnly ? 'mt-2' : 'mt-3'">
    <div class="text-black font-weight-bold headline px-4 mb-4">{{ t('walletTransfer.transferDetails') }}</div>
    <v-flex xs12 mb-4>
      <v-form ref="form" v-model="formValid" lazy-validation aria-autocomplete="off" autocomplete="off" @submit.prevent="sendCoin">
        <v-layout wrap>
          <v-flex xs12 sm6 px-4 mb-5>
            <span class="subtitle-2">{{ t('walletTransfer.selectItem') }}</span>
            <div v-if="selectedItemDisplay">
              <v-menu transition="slide-y-transition" bottom>
                <template v-slot:activator="{ on }">
                  <v-chip class="select-coin" label outlined large v-on="on">
                    <img
                      class="mr-2"
                      :src="
                        contractType === CONTRACT_TYPE_ERC721
                          ? selectedItemDisplay.logo
                          : require(`../../../public/images/logos/${selectedItemDisplay.logo}`)
                      "
                      height="20px"
                      onerror="if (this.src !== 'eth.svg') this.src = 'images/logos/eth.svg';"
                      :alt="selectedItemDisplay.name"
                    />
                    <span class="select-coin-name">{{ selectedItemDisplay.name }}</span>
                    <div class="flex-grow-1 text-right pr-2">
                      <v-icon right>$vuetify.icons.select</v-icon>
                    </div>
                  </v-chip>
                </template>
                <v-list class="select-item-list">
                  <v-list-item
                    v-for="token in finalBalancesArrayEthOnly"
                    :key="token.id"
                    class="select-coin-eth"
                    @click="selectedItemChanged(token.tokenAddress)"
                  >
                    <v-list-item-icon class="mr-1">
                      <img
                        :src="require(`../../../public/images/logos/${token.logo}`)"
                        height="20px"
                        onerror="if (this.src != 'eth.svg') this.src = 'images/logos/eth.svg';"
                        :alt="token.name"
                      />
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title class="body-2">{{ token.name }} ({{ token.symbol }})</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-divider class="mx-3"></v-divider>
                  <v-subheader v-if="finalBalancesArrayTokens.length > 0" class="body-2">
                    <v-icon small left class="mr-2">$vuetify.icons.token</v-icon>
                    {{ t('walletTransfer.tokens') }}
                  </v-subheader>
                  <v-list-item v-for="token in finalBalancesArrayTokens" :key="token.id" @click="selectedItemChanged(token.tokenAddress)">
                    <v-list-item-icon class="ml-8 mr-1">
                      <img
                        :src="require(`../../../public/images/logos/${token.logo}`)"
                        height="20px"
                        onerror="if (this.src !== 'eth.svg') this.src = 'images/logos/eth.svg';"
                        :alt="token.name"
                      />
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title class="body-2">{{ token.name }} ({{ token.symbol }})</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-divider class="mx-3"></v-divider>
                  <v-subheader v-if="collectibles.length > 0" class="body-2">
                    <v-icon small left class="mr-2">$vuetify.icons.collectibles</v-icon>
                    {{ t('walletTransfer.collectibles') }}
                  </v-subheader>
                  <v-list-item v-for="collectible in collectibles" :key="collectible.address" @click="selectedItemChanged(collectible.address)">
                    <v-list-item-icon class="ml-8 mr-1">
                      <img :src="collectible.logo" height="20px" />
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title class="body-2">{{ collectible.name }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </v-flex>
          <v-flex v-if="selectedItem" xs12 sm6 mb-5 px-4>
            <span class="subtitle-2">{{ t('walletTransfer.accountBalance') }}</span>
            <ComponentLoader v-if="!weiBalanceLoaded || !tokenDataLoaded" class="mt-2" />
            <div v-else>
              <span id="account-balance" class="headline mr-1">{{ selectedItem.formattedBalance }}</span>
              <span class="caption text_2--text">{{ currencyBalanceDisplay }}</span>
            </div>
            <div class="caption font-weight-regular text_2--text">{{ selectedItem.currencyRateText }}</div>
          </v-flex>
        </v-layout>
        <v-layout wrap>
          <v-flex xs12 sm6 px-4>
            <v-layout wrap>
              <v-flex xs12>
                <span class="subtitle-2">{{ t('walletTransfer.transferMode') }}</span>
              </v-flex>
              <v-flex xs12 sm6 class="recipient-address-container" :class="$vuetify.breakpoint.xsOnly ? '' : 'pr-1'">
                <v-combobox
                  id="recipient-address"
                  ref="contactSelected"
                  :name="randomName"
                  class="recipient-address"
                  :value="contactSelected"
                  :items="contactList"
                  :placeholder="verifierPlaceholder"
                  required
                  :rules="[contactRule, rules.required]"
                  outlined
                  :error="ensError !== ''"
                  :error-messages="ensError"
                  item-text="name"
                  item-value="value"
                  aria-label="Recipient Address"
                  :return-object="false"
                  @input="contactChanged"
                >
                  <template v-slot:append>
                    <v-btn icon small color="primary" aria-label="QR Capture Button" @click="() => $refs && $refs.captureQr.$el.click()">
                      <v-icon small>$vuetify.icons.scan</v-icon>
                    </v-btn>
                  </template>
                </v-combobox>
                <QrcodeCapture ref="captureQr" style="display: none" @decode="onDecodeQr" />
                <div v-if="qrErrorMsg !== ''" class="v-text-field__details torus-hint">
                  <div class="v-messages">
                    <div class="v-messages__wrapper">
                      <div class="v-messages__message d-flex error--text px-3">{{ qrErrorMsg }}</div>
                    </div>
                  </div>
                </div>
              </v-flex>
              <v-flex xs12 sm6 class="recipient-verifier-container" :class="$vuetify.breakpoint.xsOnly ? '' : 'pl-1'">
                <v-select
                  id="recipient-verifier"
                  v-model="selectedVerifier"
                  outlined
                  append-icon="$vuetify.icons.select"
                  :items="verifierOptions"
                  item-text="name"
                  item-value="value"
                  :rules="[rules.required]"
                  aria-label="Recipient Selector"
                  @blur="verifierChangedManual"
                ></v-select>
              </v-flex>
              <v-flex v-if="newContact && $refs.contactSelected && $refs.contactSelected.valid && selectedVerifier !== ''" xs12 mb-2>
                <AddContact :contact="contactSelected" :verifier="selectedVerifier"></AddContact>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
        <v-layout wrap>
          <v-flex xs12 px-4 sm6 class="you-send-container">
            <div>
              <span class="subtitle-2">{{ t('walletTransfer.youSend') }}</span>
              <a
                v-if="contractType !== CONTRACT_TYPE_ERC721 && !isSendAll"
                id="send-all-btn"
                class="float-right primary--text subtitle-2"
                @click="sendAll"
              >
                {{ t('walletTransfer.sendAll') }}
              </a>
              <a v-if="isSendAll" id="send-all-reset-btn" class="float-right primary--text subtitle-2" @click="resetSendAll">
                {{ t('walletTransfer.reset') }}
              </a>
            </div>
            <v-select
              v-if="contractType === CONTRACT_TYPE_ERC721"
              v-model="assetSelected"
              :items="collectibleSelected.assets"
              outlined
              item-text="name"
              append-icon="$vuetify.icons.select"
              return-object
              aria-label="Asset selector"
            >
              <template v-slot:prepend-inner>
                <img :src="assetSelected.image" height="24px" :alt="assetSelected.name" />
              </template>
              <template v-slot:item="{ item }">
                <img class="mr-2" :src="item.image" height="24px" :alt="item.name" />
                {{ item.name }}
              </template>
            </v-select>
            <v-text-field
              v-if="contractType !== CONTRACT_TYPE_ERC721"
              id="you-send"
              :hint="convertedAmount ? `~ ${convertedAmount} ${!!toggle_exclusive ? selectedItem.symbol : selectedCurrency}` : ''"
              persistent-hint
              type="number"
              outlined
              required
              :value="displayAmount"
              :readonly="isSendAll"
              :rules="[rules.required, lesserThan, moreThanZero]"
              aria-label="Amount you send"
              @change="onChangeDisplayAmount"
            >
              <template v-slot:append>
                <v-btn
                  id="coin-mode-btn"
                  small
                  :outlined="!toggle_exclusive"
                  :text="!!toggle_exclusive"
                  :color="!toggle_exclusive ? 'primary' : 'text_2'"
                  @click="changeSelectedToCurrency(0)"
                >
                  {{ selectedItem && selectedItem.symbol }}
                </v-btn>
                <v-btn
                  id="currency-mode-btn"
                  small
                  :outlined="!!toggle_exclusive"
                  :text="!toggle_exclusive"
                  :color="toggle_exclusive ? 'primary' : 'text_2'"
                  @click="changeSelectedToCurrency(1)"
                >
                  {{ selectedCurrency }}
                </v-btn>
              </template>
            </v-text-field>
          </v-flex>
        </v-layout>
        <v-layout wrap>
          <TransactionSpeedSelect
            :reset-speed="resetSpeed"
            :symbol="contractType !== CONTRACT_TYPE_ERC721 ? selectedItem.symbol : 'ETH'"
            :gas="gas"
            :display-amount="displayAmount"
            :selected-currency="selectedCurrency"
            :currency-multiplier="getCurrencyMultiplier"
            @onSelectSpeed="onSelectSpeed"
          />
        </v-layout>
        <v-layout v-if="contractType !== CONTRACT_TYPE_ERC721" wrap>
          <v-flex xs12 px-4 sm6>
            <div>
              <span class="subtitle-2">{{ t('walletTransfer.totalCost') }}</span>
            </div>
            <v-text-field
              id="total-cost"
              :suffix="totalCostSuffix"
              :hint="convertedTotalCost ? convertedTotalCostDisplay : ''"
              persistent-hint
              outlined
              readonly
              :value="totalCost"
            ></v-text-field>
          </v-flex>
        </v-layout>
        <v-layout mt-4 wrap>
          <v-flex xs12 px-4 sm6 class="text-right">
            <v-btn
              id="wallet-transfer-submit"
              large
              depressed
              color="primary"
              :disabled="!formValid || speedSelected === '' || selectedVerifier === ''"
              class="px-6"
              @click="onTransferClick"
            >
              {{ t('walletTransfer.transfer') }}
            </v-btn>
            <v-dialog v-model="confirmDialog" max-width="550" persistent>
              <TransferConfirm
                :to-address="toEthAddress"
                :converted-amount="
                  convertedAmount
                    ? `~ ${convertedAmount} ${
                        !!toggle_exclusive ? (contractType === CONTRACT_TYPE_ERC721 ? '' : selectedItem.symbol) : selectedCurrency
                      }`
                    : ''
                "
                :display-amount="
                  `${displayAmount} ${!toggle_exclusive ? (contractType === CONTRACT_TYPE_ERC721 ? '' : selectedItem.symbol) : selectedCurrency}`
                "
                :asset-selected="contractType === CONTRACT_TYPE_ERC721 ? assetSelected : {}"
                :is-non-fungible-token="contractType === CONTRACT_TYPE_ERC721"
                :speed-selected="timeTaken"
                :transaction-fee="gasPriceInCurrency"
                :selected-currency="selectedCurrency"
                :send-eth-to-contract-error="sendEthToContractError"
                @onClose="confirmDialog = false"
                @onConfirm="sendCoin"
              ></TransferConfirm>
            </v-dialog>
          </v-flex>
        </v-layout>

        <v-layout mt-4 pr-2 wrap>
          <v-spacer></v-spacer>
          <v-dialog v-model="showModalMessage" max-width="500" persistent>
            <MessageModal
              :modal-type="modalMessageSuccess"
              :title="modalMessageSuccess ? t('walletTransfer.transferSuccessTitle') : t('walletTransfer.transferFailTitle')"
              :detail-text="
                modalMessageSuccess
                  ? t('walletTransfer.transferSuccessMessage').replace(/\{time\}/gi, timeTaken)
                  : t('walletTransfer.transferFailMessage')
              "
              @onClose="showModalMessage = false"
            />
          </v-dialog>
        </v-layout>
      </v-form>
    </v-flex>
  </v-layout>
</template>

<script>
import randomId from '@chaitanyapotti/random-id'
import BigNumber from 'bignumber.js'
import erc721TransferABI from 'human-standard-collectible-abi'
import erc20TransferABI from 'human-standard-token-abi'
import log from 'loglevel'
import { QrcodeCapture } from 'vue-qrcode-reader'
import { isAddress, toChecksumAddress } from 'web3-utils'

import TransferConfirm from '../../components/Confirm/TransferConfirm'
import ComponentLoader from '../../components/helpers/ComponentLoader'
import TransactionSpeedSelect from '../../components/helpers/TransactionSpeedSelect'
import AddContact from '../../components/WalletTransfer/AddContact'
import MessageModal from '../../components/WalletTransfer/MessageModal'
import config from '../../config'
import torus from '../../torus'
import { ALLOWED_VERIFIERS, CONTRACT_TYPE_ERC20, CONTRACT_TYPE_ERC721, CONTRACT_TYPE_ETH, ENS, ETH, GOOGLE, OLD_ERC721_LIST } from '../../utils/enums'
import { post } from '../../utils/httpHelpers'
import { getEtherScanHashLink, significantDigits, validateVerifierId } from '../../utils/utils'

export default {
  name: 'WalletTransfer',
  components: {
    TransactionSpeedSelect,
    MessageModal,
    QrcodeCapture,
    AddContact,
    ComponentLoader,
    TransferConfirm
  },
  data() {
    return {
      sendEthToContractError: false,
      contractType: CONTRACT_TYPE_ETH,
      isContract: false,
      collectibleSelected: {},
      assetSelected: {},
      tokenAddress: '0x',
      toEthAddress: '0x',
      amount: new BigNumber('0'),
      displayAmount: new BigNumber('0'),
      convertedAmount: '',
      contactSelected: '',
      toAddress: '',
      formValid: false,
      ensError: '',
      toggle_exclusive: 0,
      gas: new BigNumber('21000'),
      activeGasPrice: new BigNumber('0'),
      gasPriceInCurrency: new BigNumber('0'),
      isFastChecked: false,
      speedSelected: '',
      totalCost: '',
      timeTaken: '',
      convertedTotalCost: '',
      resetSpeed: false,
      qrErrorMsg: '',
      autoSelectVerifier: true,
      selectedVerifier: '',
      rules: {
        required: value => !!value || this.t('walletTransfer.required')
      },
      nodeDetails: {},
      showModalMessage: false,
      modalMessageSuccess: null,
      isSendAll: false,
      confirmDialog: false,
      CONTRACT_TYPE_ETH,
      CONTRACT_TYPE_ERC20,
      CONTRACT_TYPE_ERC721
    }
  },
  computed: {
    verifierOptions() {
      const verifiers = JSON.parse(JSON.stringify(ALLOWED_VERIFIERS))
      return verifiers.map(verifier => {
        verifier.name = this.t(verifier.name)
        return verifier
      })
    },
    randomName() {
      return `torus-${torus.instanceId}`
    },
    selectedCurrency() {
      return this.$store.state.selectedCurrency
    },
    finalBalancesArray() {
      return this.$store.getters.tokenBalances.finalBalancesArray || []
    },
    finalBalancesArrayTokens() {
      return this.$store.getters.tokenBalances.finalBalancesArray.filter(token => token.tokenAddress !== '0x') || []
    },
    finalBalancesArrayEthOnly() {
      return this.$store.getters.tokenBalances.finalBalancesArray.filter(token => token.tokenAddress === '0x') || []
    },
    weiBalanceLoaded() {
      return this.$store.state.weiBalanceLoaded
    },
    tokenDataLoaded() {
      return this.$store.state.tokenDataLoaded
    },
    collectibles() {
      return this.$store.getters.collectibleBalances
    },
    selectedItem() {
      return this.finalBalancesArray.find(x => x.tokenAddress === this.selectedTokenAddress)
    },
    selectedItemDisplay() {
      if (this.contractType !== CONTRACT_TYPE_ERC721) return this.selectedItem

      return this.collectibles.find(x => x.address === this.collectibleSelected.address)
    },
    selectedTokenAddress() {
      if (this.tokenAddress === '0x' || !isAddress(this.tokenAddress)) return '0x'
      return toChecksumAddress(this.tokenAddress)
    },
    getCurrencyMultiplier() {
      const { selectedCurrency, currencyData } = this.$store.state || {}
      const currencyMultiplierNumber = selectedCurrency !== 'ETH' ? currencyData[selectedCurrency.toLowerCase()] || 1 : 1
      return new BigNumber(currencyMultiplierNumber)
    },
    getCurrencyTokenRate() {
      const { tokenRates } = this.$store.state
      const currencyMultiplier = this.getCurrencyMultiplier
      let tokenRateMultiplierNumber = 1
      if (this.contractType === CONTRACT_TYPE_ERC20) tokenRateMultiplierNumber = tokenRates[this.selectedTokenAddress.toLowerCase()] || 0
      const tokenRateMultiplier = new BigNumber(tokenRateMultiplierNumber)
      return currencyMultiplier.times(tokenRateMultiplier)
    },
    convertedTotalCostDisplay() {
      // TODO
      return `~ ${significantDigits(this.convertedTotalCost)} ${this.selectedCurrency}`
    },
    currencyBalanceDisplay() {
      // = 390.00 USD
      // USD 4,138.16
      const getNumber = this.selectedItem.currencyBalance.split(' ')[1]
      return `= ${getNumber} ${this.selectedCurrency}`
    },
    totalCostSuffix() {
      return this.contractType === CONTRACT_TYPE_ETH ? (this.toggle_exclusive === 0 ? this.selectedItem.symbol : this.selectedCurrency) : ''
    },
    verifierPlaceholder() {
      return this.selectedVerifier
        ? `${this.t('walletSettings.enter')} ${this.verifierOptions.find(verifier => verifier.value === this.selectedVerifier).name}`
        : ''
    },
    contactList() {
      return this.$store.state.contacts.reduce((mappedObject, contact) => {
        if (contact.verifier === this.selectedVerifier || this.selectedVerifier === '') {
          mappedObject.push({
            name: `${contact.name} (${contact.contact})`,
            value: contact.contact,
            verifier: contact.verifier
          })
        }
        return mappedObject
      }, [])
    },
    newContact() {
      if (!this.contactSelected) return false

      const targetContact = this.contactSelected
      const addressFound = this.contactList.find(contact => contact.value.toLowerCase() === targetContact.toLowerCase())
      return addressFound === undefined
    },
    selectedAddress() {
      return this.$store.state.selectedAddress
    }
  },
  watch: {
    selectedAddress(newValue, oldValue) {
      if (newValue !== oldValue) this.calculateGas(newValue)
    }
  },
  mounted() {
    if (Object.prototype.hasOwnProperty.call(this.$route.query, 'to')) {
      this.selectedVerifier = ETH
      this.toAddress = this.$route.query.to
    } else {
      this.toAddress = ''
    }

    this.setRandomId()

    this.contactSelected = this.toAddress

    this.$watch('collectibles', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        this.updateFieldsBasedOnRoute()
      }
    })

    const tokensUnwatch = this.$watch('finalBalancesArray', (newValue, oldValue) => {
      if (newValue !== oldValue) {
        this.updateFieldsBasedOnRoute()
        tokensUnwatch()
      }
    })

    this.updateFieldsBasedOnRoute()

    torus.nodeDetailManager
      .getNodeDetails()
      .then(nodeDetails => {
        this.nodeDetails = nodeDetails
      })
      .catch(error => log.error(error))
  },
  methods: {
    onChangeDisplayAmount(value) {
      if ((BigNumber.isBigNumber(value) && !this.displayAmount.eq(value)) || !BigNumber.isBigNumber(value)) {
        this.displayAmount = BigNumber.isBigNumber(value) ? value : new BigNumber(value || '0')
        if (this.toggle_exclusive === 0) {
          this.amount = this.displayAmount
        } else {
          this.amount = this.getCurrencyTokenRate.gt(new BigNumber('0'))
            ? this.displayAmount.div(this.getCurrencyTokenRate)
            : this.displayAmount.times(this.getCurrencyTokenRate)
        }

        this.convertedAmount = this.toggle_exclusive
          ? significantDigits(this.displayAmount.div(this.getCurrencyTokenRate), false, 4)
          : significantDigits(this.displayAmount.times(this.getCurrencyTokenRate), false, 4)

        this.updateTotalCost()
      }
    },
    updateFieldsBasedOnRoute() {
      if (Object.prototype.hasOwnProperty.call(this.$route.query, 'contract')) {
        this.selectedItemChanged(
          this.$route.query.contract,
          Object.prototype.hasOwnProperty.call(this.$route.query, 'asset') ? this.$route.query.asset : ''
        )
      }
    },
    sendEmail(typeToken, transactionHash) {
      if (/\S+@\S+\.\S+/.test(this.toAddress)) {
        const etherscanLink = getEtherScanHashLink(transactionHash, this.$store.state.networkType.host)
        const emailObject = {
          from_name: this.$store.state.userInfo.name,
          to_email: this.toAddress,
          total_amount: this.amount.toString(),
          token: typeToken.toString(),
          etherscanLink
        }
        post(`${config.api}/transaction/sendemail`, emailObject, {
          headers: {
            Authorization: `Bearer ${this.$store.state.jwtToken}`,
            'Content-Type': 'application/json; charset=utf-8'
          }
        })
          .then(response => log.info('email response', response))
          .catch(error => log.error(error))
      }
    },
    moreThanZero(value) {
      if (this.selectedItem) {
        return new BigNumber(value || '0').gt(new BigNumber('0')) || this.t('walletTransfer.invalidAmount')
      }
      return ''
    },
    lesserThan(value) {
      if (this.selectedItem) {
        let amount = new BigNumber(value || '0')
        if (this.toggle_exclusive === 1) {
          amount = amount.div(this.getCurrencyTokenRate)
        }
        return amount.lte(this.selectedItem.computedBalance) || this.t('walletTransfer.insufficient')
      }
      return ''
    },
    contactRule(contact) {
      let value = ''
      if (contact && typeof contact === 'string') value = contact
      else if (contact && contact.value) value = contact.value
      return validateVerifierId(this.selectedVerifier, value)
    },
    verifierChangedManual() {
      this.setRandomId()
      this.autoSelectVerifier = false
      this.$refs.form.validate()
    },
    contactChanged(contact) {
      this.contactSelected = contact
      if (contact) this.toAddress = contact
      log.info(contact, 'contactChanged')

      // Autoupdate selected verifier
      if (this.autoSelectVerifier) {
        const contactFound = this.contactList.find(item => item.value === contact)
        if (contactFound) {
          this.selectedVerifier = contactFound.verifier
        } else if (this.toAddress.startsWith('0x')) {
          this.selectedVerifier = ETH
        } else if (/@/.test(this.toAddress)) {
          this.selectedVerifier = GOOGLE
        } else if (
          /.eth$/.test(this.toAddress) ||
          /.xyz$/.test(this.toAddress) ||
          /.crypto$/.test(this.toAddress) ||
          /.kred$/i.test(this.toAddress)
        ) {
          this.selectedVerifier = ENS
        }
      }
      this.ensError = ''
    },
    calculateGas(toAddress) {
      this.sendEthToContractError = false
      if (isAddress(toAddress)) {
        // eslint-disable-next-line no-unused-vars
        return new Promise((resolve, reject) => {
          if (this.contractType === CONTRACT_TYPE_ETH) {
            const value = '0x'
            this.amount
              .times(new BigNumber(10).pow(new BigNumber(18)))
              .dp(0, BigNumber.ROUND_DOWN)
              .toString(16)
            log.info(this.gas.toString())
            torus.web3.eth
              .estimateGas({ to: toAddress, value })
              .then(response => {
                let resolved = new BigNumber(response || '0')
                if (!resolved.eq(new BigNumber('21000'))) {
                  resolved = new BigNumber(resolved.times(new BigNumber('1.1')).toFixed(0))
                  this.sendEthToContractError = this.isSendAll
                }
                resolve(resolved)
              })
              .catch(error => {
                log.error(error)
                resolve(new BigNumber('0'))
              })
          } else if (this.contractType === CONTRACT_TYPE_ERC20) {
            const { selectedAddress } = this
            const value = '0x'
            this.amount
              .times(new BigNumber(10).pow(new BigNumber(this.selectedItem.decimals)))
              .dp(0, BigNumber.ROUND_DOWN)
              .toString(16)
            this.getTransferMethod(this.contractType, selectedAddress, toAddress, value)
              .estimateGas({ from: selectedAddress })
              .then(response => {
                resolve(new BigNumber(response || '0'))
              })
              .catch(error => {
                log.error(error)
                resolve(new BigNumber('0'))
              })
          } else if (this.contractType === CONTRACT_TYPE_ERC721) {
            const { selectedAddress } = this
            this.getTransferMethod(this.contractType, selectedAddress, toAddress, this.assetSelected.tokenId)
              .estimateGas({ from: selectedAddress })
              .then(response => {
                resolve(new BigNumber(response || '0'))
              })
              .catch(error => {
                log.error(error)
                resolve(new BigNumber('0'))
              })
          }
        })
      }
      return Promise.resolve(new BigNumber('21000'))
    },
    getTransferMethod(contractType, selectedAddress, toAddress, value) {
      // For support of older ERC721
      if (Object.prototype.hasOwnProperty.call(OLD_ERC721_LIST, this.selectedTokenAddress.toLowerCase()) || contractType === CONTRACT_TYPE_ERC20) {
        const contractInstance = new torus.web3.eth.Contract(erc20TransferABI, this.selectedTokenAddress)
        return contractInstance.methods.transfer(toAddress, value)
      }
      if (contractType === CONTRACT_TYPE_ERC721) {
        const contractInstance = new torus.web3.eth.Contract(erc721TransferABI, this.selectedTokenAddress)
        return contractInstance.methods.safeTransferFrom(selectedAddress, toAddress, value)
      }
      throw new Error('Invalid Contract Type')
    },
    async selectedItemChanged(address, tokenId) {
      const foundInBalances = this.finalBalancesArray.find(token => token.tokenAddress.toLowerCase() === address.toLowerCase())
      const foundInCollectibles = this.collectibles.find(token => token.address.toLowerCase() === address.toLowerCase())
      if (foundInBalances) {
        this.tokenAddress = foundInBalances.tokenAddress
        this.contractType = foundInBalances.erc20 ? CONTRACT_TYPE_ERC20 : CONTRACT_TYPE_ETH
        this.collectibleSelected = ''
        this.assetSelected = ''
      } else if (foundInCollectibles) {
        this.tokenAddress = foundInCollectibles.address
        this.contractType = CONTRACT_TYPE_ERC721
        this.collectibleSelected = foundInCollectibles
        if (foundInCollectibles.assets && foundInCollectibles.assets.length > 0) {
          this.assetSelected = tokenId
            ? foundInCollectibles.assets.find(asset => asset.tokenId.toString() === tokenId.toString()) || foundInCollectibles.assets[0]
            : foundInCollectibles.assets[0]
        }
        // Reset you send
        this.resetSendAll()
      }
      this.gas = await this.calculateGas(this.toAddress)
      this.updateTotalCost()
    },
    getEnsAddress(ens) {
      return torus.web3.eth.ens.getAddress(ens)
    },
    async onTransferClick() {
      if (this.$refs.form.validate()) {
        let toAddress
        log.info(this.toAddress, this.selectedVerifier)
        if (isAddress(this.toAddress)) {
          toAddress = toChecksumAddress(this.toAddress)
        } else if (this.selectedVerifier === ENS) {
          try {
            const ethAddr = await this.getEnsAddress(this.toAddress)
            log.info(ethAddr)
            toAddress = ethAddr
          } catch (error) {
            log.error(error)
            this.ensError = 'Invalid ENS address'
            return
          }
        } else {
          try {
            toAddress = await torus.getPublicAddress(this.nodeDetails.torusNodeEndpoints, this.nodeDetails.torusNodePub, {
              verifier: this.selectedVerifier,
              verifierId: this.toAddress
            })
          } catch (error) {
            log.error(error)
          }
        }
        this.toEthAddress = toAddress
        this.gas = await this.calculateGas(toAddress)
        this.updateTotalCost()
        this.confirmDialog = true
      }
    },
    changeSelectedToCurrency(value) {
      this.toggle_exclusive = value
      const currencyRate = this.getCurrencyTokenRate
      if (value === 0) {
        this.onChangeDisplayAmount(this.displayAmount.div(currencyRate))
      } else if (value === 1) {
        this.onChangeDisplayAmount(this.displayAmount.times(currencyRate))
      }
    },
    sendAll() {
      const ethBalance = this.selectedItem.computedBalance
      const currencyBalance = ethBalance.times(this.getCurrencyTokenRate)
      const ethGasPrice = this.getEthAmount(this.gas, this.activeGasPrice)
      const currencyGasPrice = ethGasPrice.times(this.getCurrencyTokenRate)

      this.isSendAll = true

      if (this.toggle_exclusive === 0) {
        this.onChangeDisplayAmount(this.contractType === CONTRACT_TYPE_ETH ? ethBalance.minus(ethGasPrice) : ethBalance)
      } else {
        this.onChangeDisplayAmount(this.contractType === CONTRACT_TYPE_ETH ? currencyBalance.minus(currencyGasPrice) : currencyBalance)
      }
    },
    resetSendAll() {
      this.onChangeDisplayAmount(new BigNumber('0'))
      this.resetSpeed = true
      this.isSendAll = false
      this.changeSelectedToCurrency(0)
    },
    async sendCoin() {
      const toAddress = this.toEthAddress
      const fastGasPrice = `0x${this.activeGasPrice.times(new BigNumber(10).pow(new BigNumber(9))).toString(16)}`
      const { selectedAddress } = this
      if (this.contractType === CONTRACT_TYPE_ETH) {
        const value = `0x${this.amount
          .times(new BigNumber(10).pow(new BigNumber(18)))
          .dp(0, BigNumber.ROUND_DOWN)
          .toString(16)}`
        log.info(this.gas.toString())
        torus.web3.eth.sendTransaction(
          {
            from: selectedAddress,
            to: toAddress,
            value,
            gas: this.gas.eq(new BigNumber('0')) ? undefined : `0x${this.gas.toString(16)}`,
            gasPrice: fastGasPrice
          },
          (error, transactionHash) => {
            if (error) {
              const regEx = new RegExp('User denied transaction signature', 'i')
              if (!error.message.match(regEx)) {
                this.showModalMessage = true
                this.modalMessageSuccess = false
              }
              log.error(error)
            } else {
              // Send email to the user
              this.sendEmail(this.selectedItem.symbol, transactionHash)

              this.showModalMessage = true
              this.modalMessageSuccess = true
            }
          }
        )
      } else if (this.contractType === CONTRACT_TYPE_ERC20) {
        const value = `0x${this.amount
          .times(new BigNumber(10).pow(new BigNumber(this.selectedItem.decimals)))
          .dp(0, BigNumber.ROUND_DOWN)
          .toString(16)}`
        this.getTransferMethod(this.contractType, selectedAddress, toAddress, value).send(
          {
            from: selectedAddress,
            gas: this.gas.eq(new BigNumber('0')) ? undefined : `0x${this.gas.toString(16)}`,
            gasPrice: fastGasPrice
          },
          (error, transactionHash) => {
            if (error) {
              const regEx = new RegExp('User denied transaction signature', 'i')
              if (!error.message.match(regEx)) {
                this.showModalMessage = true
                this.modalMessageSuccess = false
              }
              log.error(error)
            } else {
              // Send email to the user
              this.sendEmail(this.selectedItem.symbol, transactionHash)

              this.showModalMessage = true
              this.modalMessageSuccess = true
            }
          }
        )
      } else if (this.contractType === CONTRACT_TYPE_ERC721) {
        this.getTransferMethod(this.contractType, selectedAddress, toAddress, this.assetSelected.tokenId).send(
          {
            from: selectedAddress,
            gas: this.gas.eq(new BigNumber('0')) ? undefined : `0x${this.gas.toString(16)}`,
            gasPrice: fastGasPrice
          },
          (error, transactionHash) => {
            if (error) {
              const regEx = new RegExp('User denied transaction signature', 'i')
              if (!error.message.match(regEx)) {
                this.showModalMessage = true
                this.modalMessageSuccess = false
              }
              log.error(error)
            } else {
              // Send email to the user
              this.sendEmail(this.assetSelected.name, transactionHash)
              this.showModalMessage = true
              this.modalMessageSuccess = true
            }
          }
        )
      }
    },
    getEthAmount(gas, gasPrice) {
      return gas.times(gasPrice).div(new BigNumber(10).pow(new BigNumber(9)))
    },
    goBack() {
      this.$router.go(-1)
    },
    updateTotalCost() {
      if (this.displayAmount.isZero() || this.activeGasPrice === '') {
        this.totalCost = '0'
        this.convertedTotalCost = '0'

        if (this.activeGasPrice !== '') {
          const gasPriceInEth = this.getEthAmount(this.gas, this.activeGasPrice)
          this.gasPriceInCurrency = gasPriceInEth.times(this.getCurrencyTokenRate)
        }
        return
      }

      this.totalCost = '0'
      this.convertedTotalCost = '0'

      // Updated you send value if send all
      if (this.isSendAll) {
        this.sendAll()
      }

      const gasPriceInEth = this.getEthAmount(this.gas, this.activeGasPrice)
      const gasPriceInCurrency = gasPriceInEth.times(this.getCurrencyTokenRate)
      const toSend = this.amount
      const toSendConverted = toSend.times(this.getCurrencyTokenRate)

      this.gasPriceInCurrency = gasPriceInCurrency

      if (this.contractType === CONTRACT_TYPE_ETH) {
        this.totalCost = this.toggle_exclusive === 0 ? toSend.plus(gasPriceInEth) : toSendConverted.plus(gasPriceInCurrency)
      } else if (this.contractType === CONTRACT_TYPE_ERC20) {
        const displayedCurrency = this.toggle_exclusive === 0 ? this.selectedItem.symbol : this.selectedCurrency
        this.totalCost = `${this.displayAmount.toString()} ${displayedCurrency} + ${significantDigits(
          this.getEthAmount(this.gas, this.activeGasPrice),
          false,
          18
        )} ETH`
      }

      this.convertedTotalCost = gasPriceInCurrency.plus(toSendConverted)
    },
    onSelectSpeed(data) {
      log.info('SET DATA: ', data)
      this.speedSelected = data.speedSelected
      this.activeGasPrice = data.activeGasPrice
      this.timeTaken = data.speed
      this.gas = data.gas

      if (data.isReset) {
        this.activeGasPrice = this.speedSelected === '' ? '' : this.activeGasPrice
        this.calculateGas()
      }

      this.updateTotalCost()

      this.resetSpeed = false
    },
    onDecodeQr(result) {
      try {
        const qrUrl = new URL(result)
        const qrParameters = new URLSearchParams(qrUrl.search)
        if (qrParameters.has('to')) {
          this.selectedVerifier = ETH
          this.toAddress = qrParameters.get('to')
        } else {
          this.toAddress = ''
          this.qrErrorMsg = 'Incorrect QR Code'
        }
      } catch (error) {
        if (isAddress(result)) {
          this.selectedVerifier = ETH
          this.toAddress = result
        } else {
          this.toAddress = ''
          this.qrErrorMsg = 'Incorrect QR Code'
        }
      } finally {
        this.contactSelected = this.toAddress
      }
    },
    setRandomId() {
      // patch fix because vuetify stopped passing attributes to underlying component
      if (this.$refs.contactSelected && this.$refs.contactSelected.$refs && this.$refs.contactSelected.$refs.input) {
        this.$refs.contactSelected.$refs.input.name = randomId()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'WalletTransfer.scss';
</style>
