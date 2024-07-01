package database

func NilIfZero[T comparable](v T) interface{} {
	var zero T
	if v == zero {
			return nil
	}
	return v
}