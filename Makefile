# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jde-la-f <jde-la-f@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2023/04/25 17:23:26 by adcarnec          #+#    #+#              #
#    Updated: 2023/11/13 13:34:35 by jde-la-f         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

all: up

up:
	docker compose up --build

dev:
	docker compose up -d db
	
status:
	docker images
	docker ps -a

stop:
	docker compose stop frontend backend db

stop-dev:
	docker compose stop db

clean: stop
	docker compose rm -s -f -v frontend backend db 
	docker rmi -f frontend backend db 

clean-dev: stop-dev
	docker compose rm -s -f -v db
	docker rmi -f db
	
fclean-dev: clean-dev
	docker system prune -af
	
fclean: clean
	docker system prune -af
	
re: fclean all

.Phony: all clean fclean
