package entity

import "github.com/ethereum/go-ethereum/common"

type UserRepository interface {
	CreateUser(User *User) (*User, error)
	FindUserById(id int) (*User, error)
	FindUserByRole(role string) (*User, error)
	FindUserByAddress(address common.Address) (*User, error)
	FindAllUsers() ([]*User, error)
	DeleteUserByAddress(address common.Address) error
}

type User struct {
	Id      int            `json:"id" db:"id"`
	Role    string         `json:"role" db:"role"`
	Address common.Address `json:"address" db:"address"`
}

func NewUser(role string, address common.Address) *User {
	return &User{
		Role:    role,
		Address: address,
	}
}
