import React from 'react'
import styled from 'styled-components'
import { Info, theme } from '@aragon/ui'
import providerString from '../../provider-strings'
import SignerButton from './SignerButton'

import { STATUS_SIGNING, STATUS_SIGNED, STATUS_ERROR } from './signer-statuses'

import imgPending from '../../assets/transaction-pending.svg'
import imgSuccess from '../../assets/transaction-success.svg'
import imgError from '../../assets/transaction-error.svg'

// Temporarily clean the error messages coming from Aragon.js and Metamask
const cleanErrorMessage = msg =>
  msg.replace(/^Returned error: /, '').replace(/^Error: /, '')

class SigningStatus extends React.Component {
  getLabel() {
    const { status } = this.props
    if (status === STATUS_SIGNING) return 'Waiting for signature…'
    if (status === STATUS_SIGNED) return 'Transaction signed!'
    if (status === STATUS_ERROR) return 'Error signing the transaction'
  }
  getInfo() {
    const { status, signError, walletProviderId } = this.props
    if (status === STATUS_SIGNING) {
      return (
        <p>
          Open {providerString('your Ethereum provider', walletProviderId)} to
          sign your transaction.
        </p>
      )
    }
    if (status === STATUS_SIGNED) {
      return (
        <p>
          Success! Your transaction has been sent to the network for processing.
        </p>
      )
    }
    if (status === STATUS_ERROR) {
      return (
        <React.Fragment>
          <p>
            Woops, something went wrong. The transaction hasn’t been signed and
            no tokens have been sent.
          </p>
          {signError && <p>Error: “{cleanErrorMessage(signError.message)}”</p>}
        </React.Fragment>
      )
    }
  }
  getCloseButton() {
    const { status, onClose } = this.props
    if (status === STATUS_ERROR || status === STATUS_SIGNED) {
      return <SignerButton onClick={onClose}>Close</SignerButton>
    }
    return null
  }
  render() {
    const { status } = this.props
    return (
      <React.Fragment>
        <Status>
          <StatusImage status={status} />
          <p>{this.getLabel()}</p>
        </Status>
        <AdditionalInfo>{this.getInfo()}</AdditionalInfo>
        {this.getCloseButton()}
      </React.Fragment>
    )
  }
}

const Status = styled.div`
  margin-top: 80px;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${theme.textSecondary};
  img {
    margin-bottom: 20px;
  }
`

const AdditionalInfo = styled(Info)`
  p + p {
    margin-top: 10px;
  }
`

// To skip the SVG rendering delay
const StatusImage = ({ status }) => (
  <StatusImageMain>
    <StatusImageImg visible={status === STATUS_SIGNING} src={imgPending} />
    <StatusImageImg visible={status === STATUS_ERROR} src={imgError} />
    <StatusImageImg visible={status === STATUS_SIGNED} src={imgSuccess} />
  </StatusImageMain>
)
const StatusImageMain = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
`
const StatusImageImg = styled.img.attrs({ alt: '' })`
  opacity: ${p => Number(p.visible)};
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
`

export default SigningStatus
