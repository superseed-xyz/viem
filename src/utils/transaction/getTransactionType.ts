import {
  InvalidSerializableTransactionError,
  type InvalidSerializableTransactionErrorType,
} from '../../errors/transaction.js'
import type { ErrorType } from '../../errors/utils.js'
import type {
  FeeValuesEIP1559,
  FeeValuesEIP4844,
  FeeValuesLegacy,
} from '../../index.js'
import type {
  TransactionRequestGeneric,
  TransactionSerializableEIP2930,
  TransactionSerializableEIP4844,
  TransactionSerializableEIP7702,
  TransactionSerializableGeneric,
} from '../../types/transaction.js'
import type { Assign, ExactPartial, IsNever, OneOf } from '../../types/utils.js'

export type GetTransactionType<
  transaction extends OneOf<
    TransactionSerializableGeneric | TransactionRequestGeneric
  > = TransactionSerializableGeneric,
  result =
    | (transaction extends LegacyProperties ? 'legacy' : never)
    | (transaction extends EIP1559Properties ? 'eip1559' : never)
    | (transaction extends EIP2930Properties ? 'eip2930' : never)
    | (transaction extends EIP4844Properties ? 'eip4844' : never)
    | (transaction extends EIP7702Properties ? 'eip7702' : never)
    | (transaction['type'] extends TransactionSerializableGeneric['type']
        ? Extract<transaction['type'], string>
        : never),
> = IsNever<keyof transaction> extends true
  ? string
  : IsNever<result> extends false
    ? result
    : string

export type GetTransactionTypeErrorType =
  | InvalidSerializableTransactionErrorType
  | ErrorType

export function getTransactionType<
  const transaction extends OneOf<
    TransactionSerializableGeneric | TransactionRequestGeneric
  >,
>(transaction: transaction): GetTransactionType<transaction> {
  if (transaction.type)
    return transaction.type as GetTransactionType<transaction>

  if (typeof transaction.authorizationList !== 'undefined')
    return 'eip7702' as any

  if (
    typeof transaction.blobs !== 'undefined' ||
    typeof transaction.blobVersionedHashes !== 'undefined' ||
    typeof transaction.maxFeePerBlobGas !== 'undefined' ||
    typeof transaction.sidecars !== 'undefined'
  )
    return 'eip4844' as any

  if (
    typeof transaction.maxFeePerGas !== 'undefined' ||
    typeof transaction.maxPriorityFeePerGas !== 'undefined'
  ) {
    return 'eip1559' as any
  }

  if (typeof transaction.gasPrice !== 'undefined') {
    if (typeof transaction.accessList !== 'undefined') return 'eip2930' as any
    return 'legacy' as any
  }

  throw new InvalidSerializableTransactionError({ transaction })
}

////////////////////////////////////////////////////////////////////////////////////////////
// Types

type BaseProperties = {
  accessList?: undefined
  authorizationList?: undefined
  blobs?: undefined
  blobVersionedHashes?: undefined
  gasPrice?: undefined
  maxFeePerBlobGas?: undefined
  maxFeePerGas?: undefined
  maxPriorityFeePerGas?: undefined
  sidecars?: undefined
}

type LegacyProperties = Assign<BaseProperties, FeeValuesLegacy>
type EIP1559Properties = Assign<
  BaseProperties,
  OneOf<
    | {
        maxFeePerGas: FeeValuesEIP1559['maxFeePerGas']
      }
    | {
        maxPriorityFeePerGas: FeeValuesEIP1559['maxPriorityFeePerGas']
      },
    FeeValuesEIP1559
  > & {
    accessList?: TransactionSerializableEIP2930['accessList'] | undefined
  }
>
type EIP2930Properties = Assign<
  ExactPartial<LegacyProperties>,
  {
    accessList: TransactionSerializableEIP2930['accessList']
  }
>
type EIP4844Properties = Assign<
  ExactPartial<EIP1559Properties>,
  ExactPartial<FeeValuesEIP4844> &
    OneOf<
      | {
          blobs: TransactionSerializableEIP4844['blobs']
        }
      | {
          blobVersionedHashes: TransactionSerializableEIP4844['blobVersionedHashes']
        }
      | {
          sidecars: TransactionSerializableEIP4844['sidecars']
        },
      TransactionSerializableEIP4844
    >
>
type EIP7702Properties = Assign<
  ExactPartial<EIP1559Properties>,
  {
    authorizationList: TransactionSerializableEIP7702['authorizationList']
  }
>
