import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isQuarterNumberInput } from '../quarter-number';

@ValidatorConstraint()
export class IsQuarterNumberInputConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    return isQuarterNumberInput(value);
  }
}

export function IsQuarterNumberInput(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: function (validationArguments: ValidationArguments) {
          return `${String(validationArguments.value)} is not valid quarter number.`;
        },
        ...validationOptions,
      },
      constraints: [],
      validator: IsQuarterNumberInputConstraint,
    });
  };
}
