<template>
  <div class="contact-list-container" :class="$vuetify.breakpoint.xsOnly ? '' : 'py-0 px-12'">
    <div class="body-2">List of Contacts</div>
    <v-card class="card-shadow mt-2">
      <v-list dense flat class="pa-0 contact-list">
        <template v-for="contact in contacts">
          <v-list-item two-line :key="`contact-${contact.id}`">
            <v-list-item-content>
              <v-list-item-title class="font-weight-regular caption">
                <span>{{ contact.name }}</span>
              </v-list-item-title>
              <v-list-item-subtitle class="font-weight-regular caption text_2--text text--lighten-2">
                <span class="text-capitalize">{{ contact.verifier === ETH ? '' : `${contact.verifier}: ` }}</span>
                <span>{{ contact.contact }}</span>
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn class="delete-btn" color="text_2" icon small @click="deleteContact(contact.id)">
                <v-icon size="10">$vuetify.icons.close</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
    <div class="body-2 mt-4">Add new contact</div>

    <v-form ref="addContactForm" v-model="contactFormValid" @submit="addContact" lazy-validation>
      <v-layout wrap class="mt-2">
        <v-flex xs12 sm6>
          <v-select
            id="select-verifier"
            class="select-verifier-container"
            outlined
            append-icon="$vuetify.icons.select"
            :items="verifierOptions"
            item-text="name"
            item-value="value"
            v-model="selectedVerifier"
            @change="$refs.addContactForm.validate()"
          ></v-select>
        </v-flex>
        <v-flex xs12>
          <v-text-field id="contact-name" v-model="newContactName" placeholder="Enter Contact Name" :rules="[rules.required]" outlined></v-text-field>
        </v-flex>
        <v-flex xs12>
          <v-text-field
            id="contact-value"
            v-model="newContact"
            :placeholder="verifierPlaceholder"
            :rules="[toAddressRule, rules.required, checkDuplicates]"
            outlined
          ></v-text-field>
        </v-flex>

        <v-flex xs12 class="pt-4 text-right">
          <v-btn id="contact-submit-btn" type="submit" color="primary" depressed class="px-12 py-1" :disabled="!contactFormValid">Add Contact</v-btn>
        </v-flex>
      </v-layout>
    </v-form>
  </div>
</template>

<script>
const { ALLOWED_VERIFIERS, ETH } = require('../../../utils/enums')
const { validateVerifierId } = require('../../../utils/utils')

export default {
  name: 'networkSettings',
  data() {
    return {
      contactFormValid: true,
      selectedVerifier: ETH,
      newContact: '',
      newContactName: '',
      rules: {
        required: value => !!value || 'Required'
      },
      verifierOptions: ALLOWED_VERIFIERS,
      ETH
    }
  },
  computed: {
    verifierPlaceholder() {
      return `Enter ${this.verifierOptions.find(verifier => verifier.value === this.selectedVerifier).name}`
    },
    contacts() {
      return this.$store.state.contacts
    }
  },
  methods: {
    checkDuplicates(value) {
      if (this.contacts) {
        return this.contacts.findIndex(x => x.contact === value) < 0 || 'Duplicate contact'
      }
      return ''
    },
    addContact(e) {
      if (this.$refs.addContactForm.validate()) {
        e.preventDefault()
        this.$store
          .dispatch('addContact', {
            contact: this.newContact,
            name: this.newContactName,
            verifier: this.selectedVerifier
          })
          .then(response => {
            this.newContact = ''
            this.newContactName = ''
            this.$refs.addContactForm.resetValidation()
          })
      }
    },
    deleteContact(contactId) {
      this.$store.dispatch('deleteContact', contactId)
    },
    toAddressRule(value) {
      return validateVerifierId(this.selectedVerifier, value)
    }
  }
}
</script>

<style lang="scss">
@import 'ContactList.scss';
</style>