package database

import (
	"github.com/devolthq/devolt/internal/domain/entity"
	"github.com/ethereum/go-ethereum/common"
	"github.com/jmoiron/sqlx"
)

type UserRepositorySqlite struct {
	Db *sqlx.DB
}

func NewUserRepositorySqlite(db *sqlx.DB) *UserRepositorySqlite {
	return &UserRepositorySqlite{
		Db: db,
	}
}

func (o *UserRepositorySqlite) CreateUser(input *entity.User) (*entity.User, error) {
	var user entity.User
	err := o.Db.QueryRowx(
		"INSERT INTO users (role, address) VALUES ($1, $2) RETURNING id, address",
		input.Role,
		input.Address,
	).StructScan(
		&user,
	)
	if err != nil {
		return nil, err
	}
	return &user, err
}

func (o *UserRepositorySqlite) FindUserById(input int) (*entity.User, error) {
	var User entity.User
	err := o.Db.Get(&User, "SELECT * FROM users WHERE id = $1", input)
	if err != nil {
		return nil, err
	}
	return &User, nil
}

func (o *UserRepositorySqlite) FindUserByRole(input string) (*entity.User, error) {
	var User entity.User
	err := o.Db.Get(&User, "SELECT * FROM users WHERE role = $1", input)
	if err != nil {
		return nil, err
	}
	return &User, nil
}

func (o *UserRepositorySqlite) FindUserByAddress(address common.Address) (*entity.User, error) {
	var User entity.User
	err := o.Db.Get(&User, "SELECT * FROM users WHERE address = $1", address)
	if err != nil {
		return nil, err
	}
	return &User, nil
}

func (o *UserRepositorySqlite) FindAllUsers() ([]*entity.User, error) {
	var Users []*entity.User
	err := o.Db.Select(&Users, "SELECT * FROM users")
	if err != nil {
		return nil, err
	}
	return Users, nil
}

func (o *UserRepositorySqlite) DeleteUserByAddress(address common.Address) error {
	_, err := o.Db.Exec("DELETE FROM users WHERE address = $1", address)
	if err != nil {
		return err
	}
	return nil
}